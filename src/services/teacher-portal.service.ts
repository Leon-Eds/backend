import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { AnnouncementService } from "./announcement.service";

/**
 * TeacherPortalService
 *
 * Provides teacher-scoped views that are filtered by the teacher's
 * class + subject assignments (TeacherSubjectAssignment).
 * Teachers can ONLY see the classes, subjects and students they are assigned to.
 */
export class TeacherPortalService {

  /**
   * Look up the Teacher record from the logged-in user's ID.
   */
  private static async resolveTeacher(schoolId: string, userId: string) {
    return prisma.teacher.findFirst({
      where: { userId, schoolId },
    });
  }

  /**
   * GET /api/teacher-portal/assignments
   * Returns every class+subject assignment for the logged-in teacher,
   * enriched with student counts per class.
   */
  static async getMyAssignments(schoolId: string, userId: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    const assignments = await prisma.teacherSubjectAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        class: {
          include: {
            students: {
              where: { status: "Active" },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    const items = assignments.map((a) => ({
      id: a.id,
      subjectId: a.subjectId,
      subjectName: a.subject?.name || "",
      classId: a.classId,
      className: a.class ? `${a.class.name} ${a.class.arm}`.trim() : "",
      studentCount: a.class?.students?.length || 0,
      assignedAt: a.assignedAt,
    }));

    return successResponse(items);
  }

  /**
   * GET /api/teacher-portal/classes
   * Returns the distinct classes assigned to the teacher (subject assignments + form classes),
   * with subjects per class, total active students, and presentToday count.
   */
  static async getMyClasses(schoolId: string, userId: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [assignments, formClasses, todayAttendances] = await Promise.all([
      prisma.teacherSubjectAssignment.findMany({
        where: { teacherId: teacher.id },
        include: {
          subject: true,
          class: {
            include: {
              students: {
                where: { status: "Active" },
                select: { id: true },
              },
              academicSession: true,
            },
          },
        },
      }),
      prisma.class.findMany({
        where: { schoolId, formTeacherId: teacher.id },
        include: {
          students: {
            where: { status: "Active" },
            select: { id: true },
          },
          academicSession: true,
          classSubjects: {
            include: { subject: true },
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ["classId"],
        where: {
          schoolId,
          date: today,
          status: "Present",
        },
        _count: {
          studentId: true,
        },
      }),
    ]);

    const attendanceMap = new Map<string, number>();
    for (const att of todayAttendances) {
      attendanceMap.set(att.classId, att._count.studentId);
    }

    // Group by classId
    const classMap = new Map<string, {
      classId: string;
      className: string;
      arm: string;
      studentCount: number;
      totalStudents: number;
      presentToday: number;
      isFormTeacher: boolean;
      academicSession: string | null;
      subjects: { subjectId: string; subjectName: string }[];
    }>();

    // 1. Process Form Classes first
    for (const fc of formClasses) {
      const key = fc.id;
      classMap.set(key, {
        classId: fc.id,
        className: `${fc.name} ${fc.arm}`.trim(),
        arm: fc.arm,
        studentCount: fc.students?.length || 0,
        totalStudents: fc.students?.length || 0,
        presentToday: attendanceMap.get(fc.id) || 0,
        isFormTeacher: true,
        academicSession: fc.academicSession?.name || null,
        subjects: fc.classSubjects
          ? fc.classSubjects.map((cs) => ({
              subjectId: cs.subjectId,
              subjectName: cs.subject?.name || "",
            }))
          : [],
      });
    }

    // 2. Process Subject Assignments
    for (const a of assignments) {
      if (!a.class) continue;
      const key = a.classId;

      if (!classMap.has(key)) {
        classMap.set(key, {
          classId: a.classId,
          className: `${a.class.name} ${a.class.arm}`.trim(),
          arm: a.class.arm,
          studentCount: a.class.students?.length || 0,
          totalStudents: a.class.students?.length || 0,
          presentToday: attendanceMap.get(a.classId) || 0,
          isFormTeacher: false,
          academicSession: a.class.academicSession?.name || null,
          subjects: [],
        });
      }

      const entry = classMap.get(key)!;
      if (a.subject && !entry.subjects.some((s) => s.subjectId === a.subjectId)) {
        entry.subjects.push({
          subjectId: a.subjectId,
          subjectName: a.subject?.name || "",
        });
      }
    }

    return successResponse(Array.from(classMap.values()));
  }

  /**
   * GET /api/teacher-portal/subjects
   * Returns the distinct subjects assigned to the teacher, with classes per subject.
   */
  static async getMySubjects(schoolId: string, userId: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    const assignments = await prisma.teacherSubjectAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        class: true,
      },
    });

    // Group by subjectId
    const subjectMap = new Map<string, {
      subjectId: string;
      subjectName: string;
      classes: { classId: string; className: string }[];
    }>();

    for (const a of assignments) {
      if (!a.subject) continue;
      const key = a.subjectId;

      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subjectId: a.subjectId,
          subjectName: a.subject.name,
          classes: [],
        });
      }

      const entry = subjectMap.get(key)!;
      if (a.class && !entry.classes.some((c) => c.classId === a.classId)) {
        entry.classes.push({
          classId: a.classId,
          className: `${a.class.name} ${a.class.arm}`.trim(),
        });
      }
    }

    return successResponse(Array.from(subjectMap.values()));
  }

  /**
   * GET /api/teacher-portal/classes/:classId/students
   * Returns students in a class, but ONLY if the teacher is assigned to that class.
   */
  static async getMyClassStudents(schoolId: string, userId: string, classId: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    // Verify teacher is assigned to this class
    const hasAssignment = await prisma.teacherSubjectAssignment.findFirst({
      where: { teacherId: teacher.id, classId },
    });

    if (!hasAssignment) {
      return failResponse("You are not assigned to this class.");
    }

    const students = await prisma.student.findMany({
      where: { schoolId, classId, status: "Active" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        gender: true,
        profilePictureUrl: true,
      },
    });

    return successResponse(students);
  }

  /**
   * Verify that a teacher is assigned to a specific class + subject combination.
   * Used by the score service to enforce assignment-based access control.
   */
  static async verifyAssignment(
    schoolId: string,
    userId: string,
    classId: string,
    subjectId: string
  ): Promise<{ allowed: boolean; teacherId: string | null; message?: string }> {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) {
      return { allowed: false, teacherId: null, message: "Teacher profile not found." };
    }

    const assignment = await prisma.teacherSubjectAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classId,
        subjectId,
      },
    });

    if (!assignment) {
      return {
        allowed: false,
        teacherId: teacher.id,
        message: "You are not assigned to teach this subject in this class.",
      };
    }

    return { allowed: true, teacherId: teacher.id };
  }

  /**
   * GET /api/teacher-portal/score-progress
   * Returns the percentage of CA1, CA2, and Exam scores recorded
   * for a specific class + subject + term by the authenticated teacher.
   */
  static async getScoreProgress(
    schoolId: string,
    userId: string,
    classId: string,
    subjectId: string,
    termId: string
  ) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    // Verify the teacher is assigned to this class + subject
    const assignment = await prisma.teacherSubjectAssignment.findFirst({
      where: { teacherId: teacher.id, classId, subjectId },
    });

    if (!assignment) {
      return failResponse("You are not assigned to teach this subject in this class.");
    }

    // Get total active students in the class
    const totalStudents = await prisma.student.count({
      where: { schoolId, classId, status: "Active" },
    });

    if (totalStudents === 0) {
      return successResponse({
        classId,
        subjectId,
        termId,
        totalStudents: 0,
        ca1Entered: 0,
        ca2Entered: 0,
        examEntered: 0,
        ca1Progress: 0,
        ca2Progress: 0,
        examProgress: 0,
      }, "No active students in this class.");
    }

    // Get all score records for this class + subject + term
    const scores = await prisma.score.findMany({
      where: { schoolId, classId, subjectId, termId },
      select: {
        studentId: true,
        firstCA: true,
        secondCA: true,
        exam: true,
      },
    });

    // Count students who have each component entered (score record exists with value > 0)
    // A score record existing at all means the teacher has interacted with it,
    // but we check > 0 to distinguish "entered" from "placeholder/not yet graded"
    let ca1Entered = 0;
    let ca2Entered = 0;
    let examEntered = 0;

    for (const s of scores) {
      if (Number(s.firstCA) > 0) ca1Entered++;
      if (Number(s.secondCA) > 0) ca2Entered++;
      if (Number(s.exam) > 0) examEntered++;
    }

    const ca1Progress = Math.round((ca1Entered / totalStudents) * 100);
    const ca2Progress = Math.round((ca2Entered / totalStudents) * 100);
    const examProgress = Math.round((examEntered / totalStudents) * 100);

    // Fetch class and subject names for context
    const [classEntity, subject] = await Promise.all([
      prisma.class.findFirst({ where: { id: classId, schoolId } }),
      prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
    ]);

    return successResponse({
      classId,
      className: classEntity ? `${classEntity.name} ${classEntity.arm}`.trim() : "",
      subjectId,
      subjectName: subject?.name || "",
      termId,
      totalStudents,
      ca1Entered,
      ca2Entered,
      examEntered,
      ca1Progress,
      ca2Progress,
      examProgress,
    }, "Score entry progress retrieved.");
  }

  /**
   * PUT /api/teacher-portal/signature
   * Allows the logged-in teacher to update their signature URL string.
   */
  static async updateTeacherSignature(schoolId: string, userId: string, signatureUrl: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    const updated = await prisma.teacher.update({
      where: { id: teacher.id },
      data: { signatureUrl },
    });

    return successResponse({
      teacherId: updated.id,
      fullName: updated.fullName,
      signatureUrl: updated.signatureUrl,
    }, "Teacher signature updated successfully.");
  }

  /**
   * GET /api/teacher-portal/form-class/students-domains
   * Gets all active students in the form teacher's class with their domain ratings and remarks for a given term.
   */
  static async getFormClassDomains(schoolId: string, userId: string, classId: string, termId: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) return failResponse("Class not found.");
    if (classEntity.formTeacherId !== teacher.id) {
      return failResponse("Access Denied: You are not the assigned Form Teacher for this class.");
    }

    const students = await prisma.student.findMany({
      where: { schoolId, classId, status: "Active" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        gender: true,
        profilePictureUrl: true,
      },
    });

    const results = await prisma.result.findMany({
      where: { schoolId, classId, termId },
    });

    const resultMap = new Map(results.map((r) => [r.studentId, r]));

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

    const items = students.map((s) => {
      const res = resultMap.get(s.id);
      return {
        studentId: s.id,
        fullName: s.fullName,
        admissionNumber: s.admissionNumber,
        gender: s.gender,
        profilePictureUrl: s.profilePictureUrl,
        resultId: res?.id || null,
        affectiveDomains: res?.affectiveDomains || defaultAffective,
        psychomotorDomains: res?.psychomotorDomains || defaultPsychomotor,
        teacherComment: res?.teacherComment || "",
        formTeacherRemark: res?.teacherComment || "",
        daysPresent: res?.daysPresent ?? 0,
        daysSchoolOpened: res?.daysSchoolOpened ?? null,
        promotedTo: res?.promotedTo || "",
      };
    });

    return successResponse({
      classId: classEntity.id,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      termId,
      students: items,
    }, "Form class student domain records retrieved.");
  }

  /**
   * PUT /api/teacher-portal/form-class/students/:studentId/domains
   * Allows Form Teachers to record/update student affective & psychomotor domains and remarks.
   */
  static async updateStudentDomains(
    schoolId: string,
    userId: string,
    studentId: string,
    payload: {
      termId: string;
      affectiveDomains?: any;
      psychomotorDomains?: any;
      teacherComment?: string;
      formTeacherRemark?: string;
      daysPresent?: number;
      daysSchoolOpened?: number;
      promotedTo?: string;
    }
  ) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) return failResponse("Teacher profile not found.");

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: true },
    });

    if (!student || !student.classId) {
      return failResponse("Student or student class profile not found.");
    }

    if (student.class?.formTeacherId !== teacher.id) {
      return failResponse("Access Denied: Only the assigned Form Teacher of this student's class can edit domain ratings.");
    }

    const term = await prisma.term.findFirst({
      where: { id: payload.termId },
    });

    if (!term) return failResponse("Term not found.");

    const existingResult = await prisma.result.findFirst({
      where: { schoolId, studentId, termId: payload.termId },
    });

    const comment = payload.formTeacherRemark !== undefined ? payload.formTeacherRemark : payload.teacherComment;

    const updateData: any = {};
    if (payload.affectiveDomains) updateData.affectiveDomains = payload.affectiveDomains;
    if (payload.psychomotorDomains) updateData.psychomotorDomains = payload.psychomotorDomains;
    if (comment !== undefined) updateData.teacherComment = comment;
    if (payload.daysPresent !== undefined) updateData.daysPresent = payload.daysPresent;
    if (payload.daysSchoolOpened !== undefined) updateData.daysSchoolOpened = payload.daysSchoolOpened;
    if (payload.promotedTo !== undefined) updateData.promotedTo = payload.promotedTo;

    let updatedResult;
    if (existingResult) {
      updatedResult = await prisma.result.update({
        where: { id: existingResult.id },
        data: updateData,
      });
    } else {
      updatedResult = await prisma.result.create({
        data: {
          schoolId,
          studentId,
          classId: student.classId,
          termId: payload.termId,
          academicSessionId: term.academicSessionId,
          totalScore: 0,
          average: 0,
          classAverage: 0,
          position: 0,
          subjectCount: 0,
          status: "Draft",
          ...updateData,
        },
      });
    }

    return successResponse({
      resultId: updatedResult.id,
      studentId: updatedResult.studentId,
      affectiveDomains: updatedResult.affectiveDomains,
      psychomotorDomains: updatedResult.psychomotorDomains,
      teacherComment: updatedResult.teacherComment,
      formTeacherRemark: updatedResult.teacherComment,
      daysPresent: updatedResult.daysPresent,
      daysSchoolOpened: updatedResult.daysSchoolOpened,
      promotedTo: updatedResult.promotedTo,
    }, "Student domain ratings and remarks updated successfully.");
  }

  /**
   * POST /api/teacher-portal/class-broadcast
   * Allows teachers to send broadcast announcements directly to assigned classes.
   */
  static async sendClassBroadcast(
    schoolId: string,
    userId: string,
    payload: { targetClassId: string; title: string; content: string; category?: string }
  ) {
    return AnnouncementService.createAnnouncement(
      schoolId,
      userId,
      {
        title: payload.title,
        content: payload.content,
        audience: "Class",
        targetClassId: payload.targetClassId,
        category: payload.category || "ACADEMIC",
      },
      "Teacher"
    );
  }
}
