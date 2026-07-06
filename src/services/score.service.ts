import { prisma } from "../config/db";
import { GradingService } from "./grading.service";
import { TeacherPortalService } from "./teacher-portal.service";
import { successResponse, failResponse } from "../utils/response";

export class ScoreService {
  private static mapToResponse(s: any, student: any, subjectName: string) {
    return {
      id: s.id,
      studentId: s.studentId,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      subjectId: s.subjectId,
      subjectName,
      firstCA: Number(s.firstCA),
      secondCA: Number(s.secondCA),
      exam: Number(s.exam),
      total: Number(s.total),
      grade: s.grade,
      remark: s.remark,
      subjectPosition: s.subjectPosition || 0,
    };
  }

  /**
   * Compute and update subject positions (rank by total descending) for all scores in a class+subject+term
   */
  private static async computeSubjectPositions(schoolId: string, classId: string, subjectId: string, termId: string) {
    const scores = await prisma.score.findMany({
      where: { schoolId, classId, subjectId, termId },
      orderBy: { total: "desc" },
    });

    let position = 0;
    let lastTotal = -1;
    for (let i = 0; i < scores.length; i++) {
      if (Number(scores[i].total) !== lastTotal) {
        position = i + 1;
        lastTotal = Number(scores[i].total);
      }
      await prisma.score.update({
        where: { id: scores[i].id },
        data: { subjectPosition: position },
      });
    }
  }

  static async enterScore(
    schoolId: string,
    teacherId: string | null,
    request: any,
    userRole?: string,
    userId?: string
  ) {
    // If the caller is a Teacher, enforce assignment-based access control
    if (userRole === "Teacher" && userId) {
      const check = await TeacherPortalService.verifyAssignment(
        schoolId,
        userId,
        request.classId,
        request.subjectId
      );
      if (!check.allowed) {
        return failResponse(check.message || "You are not assigned to teach this subject in this class.");
      }
      teacherId = check.teacherId;
    }

    const student = await prisma.student.findFirst({
      where: { id: request.studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found in this school.");
    }

    const subject = await prisma.subject.findFirst({
      where: { id: request.subjectId, schoolId },
    });

    if (!subject) {
      return failResponse("Subject not found in this school.");
    }

    // Check if scores are locked (result already submitted/approved/published)
    const existingResult = await prisma.result.findFirst({
      where: {
        schoolId,
        studentId: request.studentId,
        termId: request.termId,
        status: { in: ["Submitted", "Approved", "Published"] },
      },
    });
    if (existingResult) {
      return failResponse("Scores are locked. The class results have already been submitted for approval.");
    }

    const total = request.firstCA + request.secondCA + request.exam;
    const grade = await GradingService.getGrade(schoolId, total);

    const existing = await prisma.score.findFirst({
      where: {
        schoolId,
        studentId: request.studentId,
        subjectId: request.subjectId,
        termId: request.termId,
      },
    });

    let scoreRecord;

    if (existing) {
      if (existing.isLocked) {
        return failResponse("This score is locked and cannot be edited.");
      }
      scoreRecord = await prisma.score.update({
        where: { id: existing.id },
        data: {
          firstCA: request.firstCA,
          secondCA: request.secondCA,
          exam: request.exam,
          total,
          grade,
          remark: request.remark || "",
          enteredByTeacherId: teacherId || null,
        },
      });
    } else {
      scoreRecord = await prisma.score.create({
        data: {
          schoolId,
          studentId: request.studentId,
          subjectId: request.subjectId,
          classId: request.classId,
          termId: request.termId,
          academicSessionId: request.academicSessionId,
          firstCA: request.firstCA,
          secondCA: request.secondCA,
          exam: request.exam,
          total,
          grade,
          remark: request.remark || "",
          enteredByTeacherId: teacherId || null,
        },
      });
    }

    // Recompute subject positions for this class+subject+term
    await this.computeSubjectPositions(schoolId, request.classId, request.subjectId, request.termId);

    // Re-fetch the score to get updated subjectPosition
    scoreRecord = await prisma.score.findUnique({ where: { id: scoreRecord.id } });

    return successResponse(
      this.mapToResponse(scoreRecord, student, subject.name),
      "Score entered successfully."
    );
  }

  static async bulkEnterScores(
    schoolId: string,
    teacherId: string | null,
    request: any,
    userRole?: string,
    userId?: string
  ) {
    // If the caller is a Teacher, enforce assignment-based access control
    if (userRole === "Teacher" && userId) {
      const check = await TeacherPortalService.verifyAssignment(
        schoolId,
        userId,
        request.classId,
        request.subjectId
      );
      if (!check.allowed) {
        return failResponse(check.message || "You are not assigned to teach this subject in this class.");
      }
      teacherId = check.teacherId;
    }

    const subject = await prisma.subject.findFirst({
      where: { id: request.subjectId, schoolId },
    });

    if (!subject) {
      return failResponse("Subject not found in this school.");
    }

    const responses: any[] = [];

    // Run sequentially to ensure proper database locking/transactions or simplicity
    // Check if scores are locked for any student in this class+term
    const lockedResult = await prisma.result.findFirst({
      where: {
        schoolId,
        classId: request.classId,
        termId: request.termId,
        status: { in: ["Submitted", "Approved", "Published"] },
      },
    });
    if (lockedResult) {
      return failResponse("Scores are locked. The class results have already been submitted for approval.");
    }

    for (const entry of request.scores) {
      const student = await prisma.student.findFirst({
        where: { id: entry.studentId, schoolId },
      });

      if (!student) continue;

      const total = entry.firstCA + entry.secondCA + entry.exam;
      const grade = await GradingService.getGrade(schoolId, total);

      const existing = await prisma.score.findFirst({
        where: {
          schoolId,
          studentId: entry.studentId,
          subjectId: request.subjectId,
          termId: request.termId,
        },
      });

      let scoreRecord;

      if (existing) {
        if (existing.isLocked) continue; // skip locked scores
        scoreRecord = await prisma.score.update({
          where: { id: existing.id },
          data: {
            firstCA: entry.firstCA,
            secondCA: entry.secondCA,
            exam: entry.exam,
            total,
            grade,
            remark: entry.remark || "",
            enteredByTeacherId: teacherId || null,
          },
        });
      } else {
        scoreRecord = await prisma.score.create({
          data: {
            schoolId,
            studentId: entry.studentId,
            subjectId: request.subjectId,
            classId: request.classId,
            termId: request.termId,
            academicSessionId: request.academicSessionId,
            firstCA: entry.firstCA,
            secondCA: entry.secondCA,
            exam: entry.exam,
            total,
            grade,
            remark: entry.remark || "",
            enteredByTeacherId: teacherId || null,
          },
        });
      }

      responses.push(this.mapToResponse(scoreRecord, student, subject.name));
    }

    // Recompute subject positions
    await this.computeSubjectPositions(schoolId, request.classId, request.subjectId, request.termId);

    return successResponse(responses, `${responses.length} scores entered successfully.`);
  }

  static async getClassScoreSheet(schoolId: string, classId: string, subjectId: string, termId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      return failResponse("Subject not found.");
    }

    const term = await prisma.term.findFirst({
      where: { id: termId },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const scores = await prisma.score.findMany({
      where: {
        schoolId,
        classId,
        subjectId,
        termId,
      },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          fullName: "asc",
        },
      },
    });

    const scoresMapped = scores.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student.fullName,
      admissionNumber: s.student.admissionNumber,
      subjectId: s.subjectId,
      subjectName: subject.name,
      firstCA: Number(s.firstCA),
      secondCA: Number(s.secondCA),
      exam: Number(s.exam),
      total: Number(s.total),
      grade: s.grade,
      remark: s.remark,
    }));

    return successResponse({
      classId: classEntity.id,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      subjectId: subject.id,
      subjectName: subject.name,
      termName: term.termNumber,
      sessionName: term.academicSession.name,
      scores: scoresMapped,
    }, "Score sheet retrieved.");
  }

  static async getStudentScores(schoolId: string, studentId: string, termId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    const scores = await prisma.score.findMany({
      where: {
        schoolId,
        studentId,
        termId,
      },
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    const response = scores.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      firstCA: Number(s.firstCA),
      secondCA: Number(s.secondCA),
      exam: Number(s.exam),
      total: Number(s.total),
      grade: s.grade,
      remark: s.remark,
    }));

    return successResponse(response, "Student scores retrieved.");
  }
}
