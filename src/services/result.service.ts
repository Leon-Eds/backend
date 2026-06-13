import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { FeeService } from "./fee.service";

export class ResultService {

  private static async resolveTeacher(schoolId: string, userId: string) {
    return prisma.teacher.findFirst({
      where: { userId, schoolId },
    });
  }

  /**
   * Helper to verify if all subjects assigned to a class have scores recorded for active students
   */
  static async checkAllSubjectsEntered(schoolId: string, classId: string, termId: string) {
    const assignedSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: { subject: true },
    });

    const activeStudents = await prisma.student.findMany({
      where: { schoolId, classId, status: "Active" },
    });

    if (assignedSubjects.length === 0 || activeStudents.length === 0) {
      return { allEntered: true, missingSubjects: [] };
    }

    const missingSubjects: string[] = [];

    for (const cs of assignedSubjects) {
      const scoreCount = await prisma.score.count({
        where: {
          schoolId,
          classId,
          termId,
          subjectId: cs.subjectId,
          studentId: { in: activeStudents.map((s) => s.id) },
        },
      });

      // If any active student is missing a score for this subject
      if (scoreCount < activeStudents.length) {
        missingSubjects.push(cs.subject.name);
      }
    }

    return {
      allEntered: missingSubjects.length === 0,
      missingSubjects,
    };
  }

  static async computeClassResults(
    schoolId: string,
    classId: string,
    termId: string,
    userId?: string,
    userRole?: string
  ) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    // Role check: Only SchoolAdmin or the class's Form Teacher can compute class results
    if (userRole === "Teacher" && userId) {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher || classEntity.formTeacherId !== teacher.id) {
        return failResponse("Access Denied: Only the assigned Form Teacher of this class can compute results.");
      }
    }

    const term = await prisma.term.findFirst({
      where: { id: termId },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const students = await prisma.student.findMany({
      where: { schoolId, classId, status: "Active" },
    });

    if (students.length === 0) {
      return failResponse("No active students in this class.");
    }

    const allScores = await prisma.score.findMany({
      where: { schoolId, classId, termId },
    });

    const studentResults: Array<{
      studentId: string;
      totalScore: number;
      average: number;
      subjectCount: number;
    }> = [];

    for (const student of students) {
      const studentScores = allScores.filter((s) => s.studentId === student.id);
      if (studentScores.length === 0) continue;

      const totalScore = studentScores.reduce((sum, s) => sum + Number(s.total), 0);
      const average = Math.round((totalScore / studentScores.length) * 100) / 100;

      studentResults.push({
        studentId: student.id,
        totalScore,
        average,
        subjectCount: studentScores.length,
      });
    }

    // Sort by average descending
    const ranked = [...studentResults].sort((a, b) => b.average - a.average);

    let position = 0;
    let lastAverage = -1;

    for (let i = 0; i < ranked.length; i++) {
      if (ranked[i].average !== lastAverage) {
        position = i + 1;
        lastAverage = ranked[i].average;
      }

      const studentData = ranked[i];

      const existingResult = await prisma.result.findFirst({
        where: {
          schoolId,
          studentId: studentData.studentId,
          termId,
        },
      });

      if (existingResult) {
        await prisma.result.update({
          where: { id: existingResult.id },
          data: {
            totalScore: studentData.totalScore,
            average: studentData.average,
            position,
            subjectCount: studentData.subjectCount,
            status: "Draft",
          },
        });
      } else {
        await prisma.result.create({
          data: {
            schoolId,
            studentId: studentData.studentId,
            classId,
            termId,
            academicSessionId: term.academicSessionId,
            totalScore: studentData.totalScore,
            average: studentData.average,
            position,
            subjectCount: studentData.subjectCount,
            status: "Draft",
          },
        });
      }
    }

    return this.getClassResults(schoolId, classId, termId);
  }

  static async submitResults(
    schoolId: string,
    classId: string,
    termId: string,
    userId: string,
    userRole: string,
    request: any
  ) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    // Role check: Only SchoolAdmin or the class's Form Teacher can submit class results
    if (userRole === "Teacher") {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher || classEntity.formTeacherId !== teacher.id) {
        return failResponse("Access Denied: Only the assigned Form Teacher of this class can submit results.");
      }
    }

    // Validation: Verify if all teachers have inputted scores for all assigned subjects
    const { allEntered, missingSubjects } = await this.checkAllSubjectsEntered(schoolId, classId, termId);
    if (!allEntered) {
      return failResponse(
        `Cannot submit results. The following subjects do not have scores for all active students: ${missingSubjects.join(", ")}`
      );
    }

    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId },
    });

    if (results.length === 0) {
      return failResponse("No results found. Please compute results first.");
    }

    // Map individual student comments
    const remarksMap = new Map((request.remarks || []).map((r: any) => [r.studentId, r.comment]));

    const operations = results.map((result) => {
      const comment = remarksMap.get(result.studentId) || "";
      return prisma.result.update({
        where: { id: result.id },
        data: {
          status: "Submitted",
          teacherComment: comment,
          submittedAt: new Date(),
        },
      });
    });

    await prisma.$transaction(operations);

    return successResponse(true, "Results submitted for approval.");
  }

  static async approveResults(schoolId: string, classId: string, termId: string, request: any) {
    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId, status: "Submitted" },
    });

    if (results.length === 0) {
      return failResponse("No submitted results found for approval.");
    }

    if (request.approve) {
      await prisma.result.updateMany({
        where: {
          schoolId,
          classId,
          termId,
          status: "Submitted",
        },
        data: {
          status: "Approved",
          adminComment: request.adminComment || "",
          approvedAt: new Date(),
        },
      });
    } else {
      await prisma.result.updateMany({
        where: {
          schoolId,
          classId,
          termId,
          status: "Submitted",
        },
        data: {
          status: "Draft",
          adminComment: request.adminComment || "",
        },
      });
    }

    return successResponse(
      true,
      request.approve ? "Results approved." : "Results rejected and sent back to draft."
    );
  }

  static async publishResults(schoolId: string, classId: string, termId: string) {
    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId, status: "Approved" },
    });

    if (results.length === 0) {
      return failResponse("No approved results found to publish.");
    }

    await prisma.result.updateMany({
      where: {
        schoolId,
        classId,
        termId,
        status: "Approved",
      },
      data: {
        status: "Published",
        publishedAt: new Date(),
      },
    });

    return successResponse(true, "Results published. Students can now view their results.");
  }

  static async getClassResults(schoolId: string, classId: string, termId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const term = await prisma.term.findFirst({
      where: { id: termId },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId },
      include: { student: true },
      orderBy: { position: "asc" },
    });

    const statusGroup = results[0]?.status || "N/A";

    const totalAverageSum = results.reduce((sum, r) => sum + Number(r.average), 0);
    const classAverage = results.length > 0 ? Math.round((totalAverageSum / results.length) * 100) / 100 : 0;

    const studentsMapped = results.map((r) => ({
      studentId: r.studentId,
      studentName: r.student.fullName,
      admissionNumber: r.student.admissionNumber,
      totalScore: Number(r.totalScore),
      average: Number(r.average),
      position: r.position,
      subjectCount: r.subjectCount,
      status: r.status,
    }));

    return successResponse({
      classId: classEntity.id,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      termName: term.termNumber,
      sessionName: term.academicSession.name,
      status: statusGroup,
      totalStudents: results.length,
      classAverage,
      students: studentsMapped,
    }, "Class results retrieved.");
  }

  static async getStudentResult(schoolId: string, studentId: string, termId: string) {
    const result = await prisma.result.findFirst({
      where: { schoolId, studentId, termId },
      include: {
        student: true,
        class: true,
        term: {
          include: { academicSession: true },
        },
      },
    });

    if (!result) {
      return failResponse("Result not found.");
    }

    const totalInClass = await prisma.result.count({
      where: { schoolId, classId: result.classId, termId },
    });

    const scores = await prisma.score.findMany({
      where: { schoolId, studentId, termId },
      include: { subject: true },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    const subjectScoresMapped = scores.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: result.student.fullName,
      admissionNumber: result.student.admissionNumber,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      firstCA: Number(s.firstCA),
      secondCA: Number(s.secondCA),
      exam: Number(s.exam),
      total: Number(s.total),
      grade: s.grade,
      remark: s.remark,
    }));

    return successResponse({
      resultId: result.id,
      studentId: result.studentId,
      studentName: result.student.fullName,
      admissionNumber: result.student.admissionNumber,
      className: result.class ? `${result.class.name} ${result.class.arm}`.trim() : "",
      termName: result.term.termNumber,
      sessionName: result.term.academicSession.name,
      totalScore: Number(result.totalScore),
      average: Number(result.average),
      position: result.position,
      subjectCount: result.subjectCount,
      totalStudentsInClass: totalInClass,
      status: result.status,
      teacherComment: result.teacherComment,
      adminComment: result.adminComment,
      subjectScores: subjectScoresMapped,
    }, "Student result retrieved.");
  }

  static async checkMyResult(schoolId: string, userId: string, termId: string) {
    const student = await prisma.student.findFirst({
      where: { schoolId, userId },
    });

    if (!student) {
      return failResponse("Student profile not found.");
    }

    const result = await prisma.result.findFirst({
      where: { schoolId, studentId: student.id, termId },
    });

    if (!result || result.status !== "Published") {
      return successResponse({
        isFeesCleared: false,
        message: "Results have not been published yet for this term.",
        result: null,
      }, "Results not yet available.");
    }

    const isCleared = await FeeService.isStudentCleared(schoolId, student.id, termId);
    if (!isCleared) {
      return successResponse({
        isFeesCleared: false,
        message: "Your fees have not been cleared for this term. Please contact the school administration.",
        result: null,
      }, "Fee clearance required.");
    }

    const fullResult = await this.getStudentResult(schoolId, student.id, termId);

    return successResponse({
      isFeesCleared: true,
      message: "Result retrieved successfully.",
      result: fullResult.data,
    }, "Result retrieved.");
  }
}
