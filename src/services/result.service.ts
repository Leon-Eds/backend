import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { FeeService } from "./fee.service";
import { formatOrdinal } from "../utils/ordinal";


function formatDateWithOrdinal(dateInput: Date | string | null | undefined): string | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const day = d.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";

  return `${day}${suffix} ${month} ${year}`;
}

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

    // Compute class average
    const totalAverageSum = ranked.reduce((sum, r) => sum + r.average, 0);
    const classAverage = ranked.length > 0 ? Math.round((totalAverageSum / ranked.length) * 100) / 100 : 0;

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
            classAverage,
            position,
            subjectCount: studentData.subjectCount,
            status: existingResult.status,
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
            classAverage,
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

    // Guard: Result editing must be deactivated before submission
    if (classEntity.isResultEditingActive) {
      return failResponse("Cannot submit results while result editing is still active. Please deactivate result editing first.");
    }

    // Validation: Verify if all teachers have inputted scores for all assigned subjects
    const { allEntered, missingSubjects } = await this.checkAllSubjectsEntered(schoolId, classId, termId);
    if (!allEntered) {
      return failResponse(
        `Cannot submit results. The following subjects do not have scores for all active students: ${missingSubjects.join(", ")}`
      );
    }

    let results = await prisma.result.findMany({
      where: { schoolId, classId, termId },
    });

    if (results.length === 0) {
      const computeRes = await this.computeClassResults(schoolId, classId, termId, userId, userRole);
      if (!computeRes.success) {
        return computeRes;
      }
      results = await prisma.result.findMany({
        where: { schoolId, classId, termId },
      });
    }

    if (results.length === 0) {
      return failResponse("No results found to submit.");
    }

    // Map individual student comments and metadata (e.g. affective/psychomotor domains, attendance, promotion)
    const studentDetailsList = request.studentDetails || request.remarks || [];
    const studentDetailsMap = new Map(studentDetailsList.map((item: any) => [item.studentId, item]));

    const operations = results.map((result) => {
      const detail: any = studentDetailsMap.get(result.studentId) || {};
      const comment = detail.teacherComment || detail.formTeacherRemark || detail.comment || "";
      const updateData: any = {
        status: "Submitted",
        teacherComment: comment,
        submittedAt: new Date(),
      };

      if (detail.affectiveDomains) updateData.affectiveDomains = detail.affectiveDomains;
      if (detail.psychomotorDomains) updateData.psychomotorDomains = detail.psychomotorDomains;
      if (detail.daysSchoolOpened !== undefined) updateData.daysSchoolOpened = Number(detail.daysSchoolOpened);
      if (detail.daysPresent !== undefined) updateData.daysPresent = Number(detail.daysPresent);
      if (detail.nextTermBegins) updateData.nextTermBegins = new Date(detail.nextTermBegins);
      if (detail.promotedTo) updateData.promotedTo = detail.promotedTo;

      return prisma.result.update({
        where: { id: result.id },
        data: updateData,
      });
    });

    await prisma.$transaction(operations);

    // Lock all scores for this class+term to prevent further edits
    await prisma.score.updateMany({
      where: { schoolId, classId, termId },
      data: { isLocked: true },
    });

    return successResponse(true, "Results submitted for approval.");
  }

  static async approveResults(schoolId: string, classId: string, termId: string, request: any) {
    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId },
    });

    if (results.length === 0) {
      return failResponse("No results found for this class and term. Please compute results first.");
    }

    const now = new Date();
    const adminComment = request.adminComment || request.principalsRemark || "";

    if (request.approve) {
      const updateData: any = {
        status: "Published",
        adminComment,
        approvedAt: now,
        publishedAt: now,
      };
      if (request.nextTermBegins) updateData.nextTermBegins = new Date(request.nextTermBegins);
      if (request.daysSchoolOpened !== undefined) updateData.daysSchoolOpened = Number(request.daysSchoolOpened);
      if (request.promotedTo) updateData.promotedTo = request.promotedTo;

      await prisma.result.updateMany({
        where: {
          schoolId,
          classId,
          termId,
        },
        data: updateData,
      });
    } else {
      await prisma.result.updateMany({
        where: {
          schoolId,
          classId,
          termId,
        },
        data: {
          status: "Draft",
          adminComment,
        },
      });

      // Unlock scores so teachers can re-enter them
      await prisma.score.updateMany({
        where: { schoolId, classId, termId },
        data: { isLocked: false },
      });
    }

    return successResponse(
      true,
      request.approve ? "Results approved and published successfully." : "Results rejected and sent back to draft."
    );
  }

  static async publishResults(schoolId: string, classId: string, termId: string) {
    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId },
    });

    if (results.length === 0) {
      return failResponse("No results found to publish.");
    }

    await prisma.result.updateMany({
      where: {
        schoolId,
        classId,
        termId,
      },
      data: {
        status: "Published",
        publishedAt: new Date(),
      },
    });

    return successResponse(true, "Results published. Students can now view their results.");
  }

  static async updateResultMetadata(
    schoolId: string,
    resultId: string,
    data: {
      affectiveDomains?: any;
      psychomotorDomains?: any;
      daysSchoolOpened?: number;
      daysPresent?: number;
      nextTermBegins?: string;
      promotedTo?: string;
      teacherComment?: string;
      adminComment?: string;
      principalsRemark?: string;
    }
  ) {
    const existing = await prisma.result.findFirst({
      where: { id: resultId, schoolId },
    });

    if (!existing) {
      return failResponse("Result record not found.");
    }

    const updateData: any = {};
    if (data.affectiveDomains) updateData.affectiveDomains = data.affectiveDomains;
    if (data.psychomotorDomains) updateData.psychomotorDomains = data.psychomotorDomains;
    if (data.daysSchoolOpened !== undefined) updateData.daysSchoolOpened = Number(data.daysSchoolOpened);
    if (data.daysPresent !== undefined) updateData.daysPresent = Number(data.daysPresent);
    if (data.nextTermBegins) updateData.nextTermBegins = new Date(data.nextTermBegins);
    if (data.promotedTo !== undefined) updateData.promotedTo = data.promotedTo;
    if (data.teacherComment !== undefined) updateData.teacherComment = data.teacherComment;

    const adminRemark = data.principalsRemark !== undefined ? data.principalsRemark : data.adminComment;
    if (adminRemark !== undefined) updateData.adminComment = adminRemark;

    const updated = await prisma.result.update({
      where: { id: resultId },
      data: updateData,
    });

    return successResponse(updated, "Result metadata updated successfully.");
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

    const defaultAffective = {
      punctuality: 5,
      neatness: 5,
      politeness: 5,
      honesty: 5,
      cooperation: 5,
      peerRelationship: 5,
    };

    const defaultPsychomotor = {
      handwriting: 5,
      publicSpeaking: 5,
      sports: 5,
      clubParticipation: 5,
      craftSkills: 5,
      musicalSkill: 5,
    };

    const studentsMapped = results.map((r) => ({
      resultId: r.id,
      studentId: r.studentId,
      studentName: r.student.fullName,
      admissionNumber: r.student.admissionNumber,
      gender: r.student.gender,
      dateOfBirth: formatDateWithOrdinal(r.student.dateOfBirth),
      totalScore: Number(r.totalScore),
      average: Number(r.average),
      position: r.position,
      subjectCount: r.subjectCount,
      status: r.status,
      teacherComment: r.teacherComment,
      formTeacherRemark: r.teacherComment,
      adminComment: r.adminComment,
      principalsRemark: r.adminComment || "",
      daysSchoolOpened: r.daysSchoolOpened ?? term.daysSchoolOpened ?? 0,
      daysPresent: r.daysPresent ?? 0,
      nextTermBegins: formatDateWithOrdinal(r.nextTermBegins ?? term.nextTermBegins),
      promotedTo: r.promotedTo || null,
      affectiveDomains: r.affectiveDomains || defaultAffective,
      psychomotorDomains: r.psychomotorDomains || defaultPsychomotor,
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
        class: {
          include: {
            formTeacher: true,
          },
        },
        term: {
          include: { academicSession: true },
        },
      },
    });

    if (!result) {
      return failResponse("Result not found.");
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

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

    // Compute subject-level stats (classAvg, high, low) across class
    const allClassScores = await prisma.score.findMany({
      where: { schoolId, classId: result.classId, termId },
      select: { subjectId: true, total: true },
    });

    const subjectScoresMap = new Map<string, number[]>();
    for (const sc of allClassScores) {
      const arr = subjectScoresMap.get(sc.subjectId) || [];
      arr.push(Number(sc.total));
      subjectScoresMap.set(sc.subjectId, arr);
    }

    const subjectStatsMap = new Map<string, { classAvg: number; high: number; low: number }>();
    for (const [subId, totals] of subjectScoresMap.entries()) {
      const sum = totals.reduce((a, b) => a + b, 0);
      const classAvg = totals.length > 0 ? Math.round((sum / totals.length) * 100) / 100 : 0;
      const high = totals.length > 0 ? Math.max(...totals) : 0;
      const low = totals.length > 0 ? Math.min(...totals) : 0;
      subjectStatsMap.set(subId, { classAvg, high, low });
    }

    const subjectScoresMapped = scores.map((s) => {
      const stats = subjectStatsMap.get(s.subjectId) || {
        classAvg: Number(s.total),
        high: Number(s.total),
        low: Number(s.total),
      };

      let pos = s.subjectPosition || 0;
      if (pos === 0) {
        const totals = subjectScoresMap.get(s.subjectId) || [];
        const higherCount = totals.filter((t) => t > Number(s.total)).length;
        pos = higherCount + 1;
      }

      return {
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
        remark: formatOrdinal(pos),
        subjectPosition: pos,
        classAvg: stats.classAvg,
        high: stats.high,
        low: stats.low,
      };
    });


    // Attendance calculation if not explicitly set
    let daysPresent = result.daysPresent;
    if (daysPresent === null || daysPresent === undefined) {
      daysPresent = await prisma.attendance.count({
        where: { schoolId, studentId, classId: result.classId, status: "Present" },
      });
    }

    let daysSchoolOpened = result.daysSchoolOpened;
    if (daysSchoolOpened === null || daysSchoolOpened === undefined) {
      daysSchoolOpened = result.term.daysSchoolOpened || 0;
      if (daysSchoolOpened === 0) {
        const uniqueDates = await prisma.attendance.groupBy({
          by: ["date"],
          where: { schoolId, classId: result.classId },
        });
        daysSchoolOpened = uniqueDates.length;
      }
    }

    const nextTermBegins = formatDateWithOrdinal(result.nextTermBegins || result.term.nextTermBegins);

    const defaultAffective = {
      punctuality: 5,
      neatness: 5,
      politeness: 5,
      honesty: 5,
      cooperation: 5,
      peerRelationship: 5,
    };

    const defaultPsychomotor = {
      handwriting: 5,
      publicSpeaking: 5,
      sports: 5,
      clubParticipation: 5,
      craftSkills: 5,
      musicalSkill: 5,
    };

    const schoolInfo = {
      name: school?.name || "",
      address: school?.address || "",
      contactEmail: school?.contactEmail || "",
      contactPhone: school?.contactPhone || "",
      logoUrl: school?.logoUrl || "",
      motto: school?.motto || "",
      website: school?.website || "",
      principalName: school?.principalName || "",
      principalSignatureUrl: school?.principalSignatureUrl || "",
    };

    const formTeacherInfo = {
      name: result.class?.formTeacher?.fullName || "",
      signatureUrl: result.class?.formTeacher?.signatureUrl || "",
    };

    return successResponse({
      resultId: result.id,
      studentId: result.studentId,
      studentName: result.student.fullName,
      admissionNumber: result.student.admissionNumber,
      passportUrl: result.student.profilePictureUrl || "",
      profilePictureUrl: result.student.profilePictureUrl || "",
      className: result.class ? `${result.class.name} ${result.class.arm}`.trim() : "",
      termName: result.term.termNumber,
      sessionName: result.term.academicSession.name,
      totalScore: Number(result.totalScore),
      average: Number(result.average),
      position: result.position,
      subjectCount: result.subjectCount,
      totalStudentsInClass: totalInClass,
      classSize: totalInClass,
      status: result.status,
      teacherComment: result.teacherComment,
      formTeacherRemark: result.teacherComment,
      adminComment: result.adminComment,
      principalsRemark: result.adminComment || "",

      // School & Principal Metadata
      schoolInfo,
      principalName: schoolInfo.principalName,
      principalSignatureUrl: schoolInfo.principalSignatureUrl,

      // Teacher Signature Metadata
      formTeacherInfo,
      formTeacherName: formTeacherInfo.name,
      formTeacherSignatureUrl: formTeacherInfo.signatureUrl,

      // Embedded metadata object for student report page
      resultMetadata: {
        classSize: totalInClass,
        totalStudentsInClass: totalInClass,
        formTeacherName: formTeacherInfo.name,
        formTeacherSignatureUrl: formTeacherInfo.signatureUrl,
        principalName: schoolInfo.principalName,
        principalSignatureUrl: schoolInfo.principalSignatureUrl,
      },

      // 1. Student Profile Extensions
      gender: result.student.gender,
      dateOfBirth: formatDateWithOrdinal(result.student.dateOfBirth),

      // 2. Term Metadata
      daysSchoolOpened,
      daysPresent,
      nextTermBegins,
      promotedTo: result.promotedTo || null,

      // 5. Domains (Rated 1-5)
      affectiveDomains: result.affectiveDomains || defaultAffective,
      psychomotorDomains: result.psychomotorDomains || defaultPsychomotor,

      // 3. Subject-Level Stats
      subjectScores: subjectScoresMapped,
    }, "Student result retrieved.");
  }

  static async checkMyResult(schoolId: string, userId: string, termId?: string) {
    const student = await prisma.student.findFirst({
      where: { schoolId, userId },
    });

    if (!student) {
      return failResponse("Student profile not found.");
    }

    let targetTermId = termId;
    if (!targetTermId) {
      const currentTerm = await prisma.term.findFirst({
        where: { isCurrent: true, academicSession: { schoolId } },
      });
      if (currentTerm) {
        targetTermId = currentTerm.id;
      } else {
        const latestResult = await prisma.result.findFirst({
          where: { schoolId, studentId: student.id, status: { in: ["Published", "Approved"] } },
          orderBy: { createdAt: "desc" },
        });
        if (latestResult) {
          targetTermId = latestResult.termId;
        }
      }
    }

    if (!targetTermId) {
      return failResponse("No active or published term found.");
    }

    const result = await prisma.result.findFirst({
      where: { schoolId, studentId: student.id, termId: targetTermId },
    });

    if (!result || (result.status !== "Published" && result.status !== "Approved")) {
      return successResponse({
        isFeesCleared: false,
        message: "Results have not been published yet for this term.",
        result: null,
      }, "Results not yet available.");
    }

    const isCleared = await FeeService.isStudentCleared(schoolId, student.id, targetTermId);
    if (!isCleared) {
      return successResponse({
        isFeesCleared: false,
        message: "Your fees have not been cleared for this term. Please contact the school administration.",
        result: null,
      }, "Fee clearance required.");
    }

    const fullResult = await this.getStudentResult(schoolId, student.id, targetTermId);

    return successResponse({
      isFeesCleared: true,
      message: "Result retrieved successfully.",
      result: fullResult.data,
      resultMetadata: fullResult.data?.resultMetadata,
    }, "Result retrieved.");
  }

  static async getPendingApprovalsCount(schoolId: string) {
    const count = await prisma.result.count({
      where: {
        schoolId,
        status: "Submitted",
      },
    });
    return successResponse({ count }, "Pending approvals count retrieved.");
  }

  static async toggleResultEditing(
    schoolId: string,
    classId: string,
    userId: string,
    userRole: string
  ) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    // Role check: Only SchoolAdmin or the class's Form Teacher can toggle
    if (userRole === "Teacher") {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher || classEntity.formTeacherId !== teacher.id) {
        return failResponse("Access Denied: Only the assigned Form Teacher of this class can toggle result editing.");
      }
    }

    const newState = !classEntity.isResultEditingActive;

    await prisma.class.update({
      where: { id: classId },
      data: { isResultEditingActive: newState },
    });

    return successResponse(
      { classId, isResultEditingActive: newState },
      newState
        ? "Result editing is now ACTIVE. Subject teachers can enter and edit scores."
        : "Result editing is now INACTIVE. Scores can no longer be added or edited."
    );
  }

  static async getResultEditingStatus(schoolId: string, classId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    return successResponse(
      {
        classId,
        className: `${classEntity.name} ${classEntity.arm}`.trim(),
        isResultEditingActive: classEntity.isResultEditingActive,
      },
      "Result editing status retrieved."
    );
  }

  static async getApprovedClassResults(schoolId: string, classId: string, termId: string) {
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
      where: {
        schoolId,
        classId,
        termId,
        status: { in: ["Approved", "Published"] },
      },
      include: { student: true },
      orderBy: { position: "asc" },
    });

    if (results.length === 0) {
      return failResponse("No approved or published results found for this class and term.");
    }

    const statusGroup = results[0]?.status || "Approved";

    const totalAverageSum = results.reduce((sum, r) => sum + Number(r.average), 0);
    const classAverage = results.length > 0 ? Math.round((totalAverageSum / results.length) * 100) / 100 : 0;

    const defaultAffective = {
      punctuality: 5,
      neatness: 5,
      politeness: 5,
      honesty: 5,
      cooperation: 5,
      peerRelationship: 5,
    };

    const defaultPsychomotor = {
      handwriting: 5,
      publicSpeaking: 5,
      sports: 5,
      clubParticipation: 5,
      craftSkills: 5,
      musicalSkill: 5,
    };

    const studentsMapped = results.map((r) => ({
      resultId: r.id,
      studentId: r.studentId,
      studentName: r.student.fullName,
      admissionNumber: r.student.admissionNumber,
      gender: r.student.gender,
      dateOfBirth: formatDateWithOrdinal(r.student.dateOfBirth),
      totalScore: Number(r.totalScore),
      average: Number(r.average),
      position: r.position,
      subjectCount: r.subjectCount,
      status: r.status,
      teacherComment: r.teacherComment,
      formTeacherRemark: r.teacherComment,
      adminComment: r.adminComment,
      principalsRemark: r.adminComment || "",
      daysSchoolOpened: r.daysSchoolOpened ?? term.daysSchoolOpened ?? 0,
      daysPresent: r.daysPresent ?? 0,
      nextTermBegins: formatDateWithOrdinal(r.nextTermBegins ?? term.nextTermBegins),
      promotedTo: r.promotedTo || null,
      affectiveDomains: r.affectiveDomains || defaultAffective,
      psychomotorDomains: r.psychomotorDomains || defaultPsychomotor,
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
    }, "Approved class results retrieved successfully.");
  }

  static async getApprovedResultsByTerm(schoolId: string, termId: string, classId?: string) {
    const term = await prisma.term.findFirst({
      where: { id: termId },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const whereCondition: any = {
      schoolId,
      termId,
      status: { in: ["Approved", "Published"] },
    };

    if (classId) {
      whereCondition.classId = classId;
    }

    const results = await prisma.result.findMany({
      where: whereCondition,
      include: {
        student: true,
        class: true,
      },
      orderBy: [
        { classId: "asc" },
        { position: "asc" },
      ],
    });

    const defaultAffective = {
      punctuality: 5,
      neatness: 5,
      politeness: 5,
      honesty: 5,
      cooperation: 5,
      peerRelationship: 5,
    };

    const defaultPsychomotor = {
      handwriting: 5,
      publicSpeaking: 5,
      sports: 5,
      clubParticipation: 5,
      craftSkills: 5,
      musicalSkill: 5,
    };

    const classMap = new Map<string, {
      classId: string;
      className: string;
      status: string;
      approvedAt: Date | null;
      publishedAt: Date | null;
      results: typeof results;
    }>();

    for (const r of results) {
      if (!classMap.has(r.classId)) {
        classMap.set(r.classId, {
          classId: r.classId,
          className: r.class ? `${r.class.name} ${r.class.arm}`.trim() : "",
          status: r.status,
          approvedAt: r.approvedAt,
          publishedAt: r.publishedAt,
          results: [],
        });
      }
      classMap.get(r.classId)!.results.push(r);
    }

    const classesData = Array.from(classMap.values()).map((c) => {
      const totalAverageSum = c.results.reduce((sum, r) => sum + Number(r.average), 0);
      const classAverage = c.results.length > 0 ? Math.round((totalAverageSum / c.results.length) * 100) / 100 : 0;

      const studentsMapped = c.results.map((r) => ({
        resultId: r.id,
        studentId: r.studentId,
        studentName: r.student.fullName,
        admissionNumber: r.student.admissionNumber,
        gender: r.student.gender,
        dateOfBirth: formatDateWithOrdinal(r.student.dateOfBirth),
        totalScore: Number(r.totalScore),
        average: Number(r.average),
        position: r.position,
        subjectCount: r.subjectCount,
        status: r.status,
        teacherComment: r.teacherComment,
        formTeacherRemark: r.teacherComment,
        adminComment: r.adminComment,
        principalsRemark: r.adminComment || "",
        daysSchoolOpened: r.daysSchoolOpened ?? term.daysSchoolOpened ?? 0,
        daysPresent: r.daysPresent ?? 0,
        nextTermBegins: formatDateWithOrdinal(r.nextTermBegins ?? term.nextTermBegins),
        promotedTo: r.promotedTo || null,
        affectiveDomains: r.affectiveDomains || defaultAffective,
        psychomotorDomains: r.psychomotorDomains || defaultPsychomotor,
      }));

      return {
        classId: c.classId,
        className: c.className,
        status: c.status,
        approvedAt: c.approvedAt,
        publishedAt: c.publishedAt,
        totalStudents: c.results.length,
        classAverage,
        students: studentsMapped,
      };
    });

    return successResponse({
      termId: term.id,
      termName: term.termNumber,
      sessionName: term.academicSession.name,
      totalClasses: classesData.length,
      classes: classesData,
    }, "Approved class results for term retrieved successfully.");
  }
}

