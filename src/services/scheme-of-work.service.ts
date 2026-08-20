import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { TeacherPortalService } from "./teacher-portal.service";

export class SchemeOfWorkService {
  private static async resolveTeacher(schoolId: string, userId: string) {
    return prisma.teacher.findFirst({
      where: { userId, schoolId },
    });
  }

  private static mapToResponse(scheme: any) {
    return {
      id: scheme.id,
      classId: scheme.classId,
      className: scheme.class ? `${scheme.class.name} ${scheme.class.arm}`.trim() : "",
      subjectId: scheme.subjectId,
      subjectName: scheme.subject?.name || "",
      termId: scheme.termId,
      teacherId: scheme.teacherId,
      teacherName: scheme.teacher?.fullName || "",
      status: scheme.status,
      rejectionReason: scheme.rejectionReason || "",
      approvedAt: scheme.approvedAt || null,
      approvedByUserId: scheme.approvedByUserId || null,
      topics: scheme.topics,
      createdAt: scheme.createdAt,
      updatedAt: scheme.updatedAt,
    };
  }

  /**
   * Create a new Scheme of Work for a subject in a class and term.
   */
  static async createSchemeOfWork(
    schoolId: string,
    userId: string,
    userRole: string,
    request: {
      classId: string;
      subjectId: string;
      termId: string;
      topics: Array<{ week: number; topic: string; description?: string }>;
    }
  ) {
    const { classId, subjectId, termId, topics } = request;

    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!classEntity) return failResponse("Class not found.");

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });
    if (!subject) return failResponse("Subject not found.");

    const term = await prisma.term.findFirst({
      where: { id: termId },
    });
    if (!term) return failResponse("Term not found.");

    let teacherId: string | null = null;

    if (userRole === "Teacher") {
      const check = await TeacherPortalService.verifyAssignment(
        schoolId,
        userId,
        classId,
        subjectId
      );
      if (!check.allowed) {
        return failResponse(check.message || "You are not assigned to teach this subject in this class.");
      }
      teacherId = check.teacherId;
    } else {
      // For Admin creation, find teacher assigned to this class and subject
      const assignment = await prisma.teacherSubjectAssignment.findFirst({
        where: { classId, subjectId },
      });
      if (assignment) {
        teacherId = assignment.teacherId;
      } else {
        // If no assigned teacher, check if admin has a teacher record or get any active teacher
        const adminTeacher = await this.resolveTeacher(schoolId, userId);
        if (adminTeacher) {
          teacherId = adminTeacher.id;
        } else {
          const fallbackTeacher = await prisma.teacher.findFirst({
            where: { schoolId, isActive: true },
          });
          if (!fallbackTeacher) {
            return failResponse("No teacher record available to associate with this scheme of work.");
          }
          teacherId = fallbackTeacher.id;
        }
      }
    }

    if (!teacherId) {
      return failResponse("Teacher assignment missing.");
    }

    // Check if scheme of work already exists
    const existing = await prisma.schemeOfWork.findFirst({
      where: { schoolId, classId, subjectId, termId },
    });

    if (existing) {
      return failResponse(
        "A scheme of work already exists for this subject in this term. Please update the existing scheme of work instead."
      );
    }

    // Format initial topics with completion flags
    const formattedTopics = topics.map((t) => ({
      week: Number(t.week),
      topic: t.topic,
      description: t.description || "",
      isCompleted: false,
      completedAt: null,
    }));

    const scheme = await prisma.schemeOfWork.create({
      data: {
        schoolId,
        classId,
        subjectId,
        termId,
        teacherId,
        status: userRole === "Teacher" ? "Submitted" : "Approved",
        approvedAt: userRole !== "Teacher" ? new Date() : null,
        approvedByUserId: userRole !== "Teacher" ? userId : null,
        topics: formattedTopics as any,
      },
      include: {
        class: true,
        subject: true,
        term: true,
        teacher: true,
      },
    });

    return successResponse(
      this.mapToResponse(scheme),
      "Scheme of work created successfully."
    );
  }

  /**
   * Update an existing Scheme of Work.
   * Locked if status === Approved (for Teachers). If status was Rejected, updating resubmits the scheme.
   */
  static async updateSchemeOfWork(
    schoolId: string,
    schemeId: string,
    userId: string,
    userRole: string,
    topics: Array<{ week: number; topic: string; description?: string }>
  ) {
    const scheme = await prisma.schemeOfWork.findFirst({
      where: { id: schemeId, schoolId },
    });

    if (!scheme) {
      return failResponse("Scheme of work not found.");
    }

    if (userRole === "Teacher") {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher || scheme.teacherId !== teacher.id) {
        const check = await TeacherPortalService.verifyAssignment(
          schoolId,
          userId,
          scheme.classId,
          scheme.subjectId
        );
        if (!check.allowed) {
          return failResponse("Access Denied: You are not authorized to edit this scheme of work.");
        }
      }

      if (scheme.status === "Approved") {
        return failResponse("Scheme of work is approved and locked. It cannot be edited by teachers.");
      }
    }

    // Preserve completion status for existing topics by matching week number
    const existingTopicsMap = new Map<number, any>();
    if (Array.isArray(scheme.topics)) {
      (scheme.topics as any[]).forEach((t) => {
        existingTopicsMap.set(Number(t.week), t);
      });
    }

    const updatedTopics = topics.map((t) => {
      const prev = existingTopicsMap.get(Number(t.week));
      return {
        week: Number(t.week),
        topic: t.topic,
        description: t.description || "",
        isCompleted: prev ? !!prev.isCompleted : false,
        completedAt: prev ? prev.completedAt : null,
      };
    });

    const updated = await prisma.schemeOfWork.update({
      where: { id: schemeId },
      data: {
        topics: updatedTopics as any,
        status: userRole === "Teacher" ? "Submitted" : scheme.status,
        rejectionReason: userRole === "Teacher" ? "" : scheme.rejectionReason,
        updatedAt: new Date(),
      },
      include: {
        class: true,
        subject: true,
        term: true,
        teacher: true,
      },
    });

    return successResponse(
      this.mapToResponse(updated),
      "Scheme of work updated successfully."
    );
  }

  /**
   * Admin endpoint to Approve or Reject a Scheme of Work.
   */
  static async reviewSchemeOfWork(
    schoolId: string,
    schemeId: string,
    adminUserId: string,
    payload: { status: "Approved" | "Rejected"; rejectionReason?: string }
  ) {
    const scheme = await prisma.schemeOfWork.findFirst({
      where: { id: schemeId, schoolId },
    });

    if (!scheme) {
      return failResponse("Scheme of work not found.");
    }

    if (payload.status === "Rejected" && !payload.rejectionReason) {
      return failResponse("Rejection reason is required when rejecting a scheme of work.");
    }

    const updated = await prisma.schemeOfWork.update({
      where: { id: schemeId },
      data: {
        status: payload.status,
        rejectionReason: payload.status === "Rejected" ? payload.rejectionReason : "",
        approvedAt: payload.status === "Approved" ? new Date() : null,
        approvedByUserId: payload.status === "Approved" ? adminUserId : null,
        updatedAt: new Date(),
      },
      include: {
        class: true,
        subject: true,
        term: true,
        teacher: true,
      },
    });

    return successResponse(this.mapToResponse(updated), `Scheme of work ${payload.status.toLowerCase()} successfully.`);
  }

  /**
   * Update completion progress for a specific week topic in a scheme of work.
   */
  static async updateTopicProgress(
    schoolId: string,
    schemeId: string,
    userId: string,
    userRole: string,
    payload: { week: number; isCompleted: boolean }
  ) {
    const scheme = await prisma.schemeOfWork.findFirst({
      where: { id: schemeId, schoolId },
    });

    if (!scheme) {
      return failResponse("Scheme of work not found.");
    }

    if (userRole === "Teacher") {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher || scheme.teacherId !== teacher.id) {
        const check = await TeacherPortalService.verifyAssignment(
          schoolId,
          userId,
          scheme.classId,
          scheme.subjectId
        );
        if (!check.allowed) {
          return failResponse("Access Denied: You are not authorized to update progress for this scheme of work.");
        }
      }
    }

    const topics: Array<any> = Array.isArray(scheme.topics) ? (scheme.topics as any[]) : [];
    const topicIndex = topics.findIndex((t) => Number(t.week) === Number(payload.week));

    if (topicIndex === -1) {
      return failResponse(`Topic for week ${payload.week} not found in this scheme of work.`);
    }

    topics[topicIndex] = {
      ...topics[topicIndex],
      isCompleted: payload.isCompleted,
      completedAt: payload.isCompleted ? new Date().toISOString() : null,
    };

    const updated = await prisma.schemeOfWork.update({
      where: { id: schemeId },
      data: {
        topics: topics as any,
        updatedAt: new Date(),
      },
      include: {
        class: true,
        subject: true,
        term: true,
        teacher: true,
      },
    });

    return successResponse(this.mapToResponse(updated), `Week ${payload.week} topic progress updated.`);
  }

  /**
   * Delete a Scheme of Work.
   */
  static async deleteSchemeOfWork(
    schoolId: string,
    schemeId: string,
    userId: string,
    userRole: string
  ) {
    const scheme = await prisma.schemeOfWork.findFirst({
      where: { id: schemeId, schoolId },
    });

    if (!scheme) {
      return failResponse("Scheme of work not found.");
    }

    if (userRole === "Teacher") {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher || scheme.teacherId !== teacher.id) {
        return failResponse("Access Denied: You are not authorized to delete this scheme of work.");
      }
    }

    await prisma.schemeOfWork.delete({
      where: { id: schemeId },
    });

    return successResponse(null, "Scheme of work deleted successfully.");
  }

  /**
   * Get Scheme of Work for a specific class, subject, and term.
   */
  static async getSchemeForSubject(
    schoolId: string,
    classId: string,
    subjectId: string,
    termId: string
  ) {
    const scheme = await prisma.schemeOfWork.findFirst({
      where: { schoolId, classId, subjectId, termId },
      include: {
        class: true,
        subject: true,
        term: {
          include: { academicSession: true },
        },
        teacher: true,
      },
    });

    if (!scheme) {
      return failResponse("Scheme of work not found for this subject and term.");
    }

    return successResponse(
      this.mapToResponse(scheme),
      "Scheme of work retrieved."
    );
  }

  /**
   * Get ALL schemes of work for a class in a given term (Student / Teacher / Admin view).
   * If approvedOnly is true (for students), only approved schemes of work are returned.
   */
  static async getClassSchemes(schoolId: string, classId: string, termId: string, approvedOnly = false) {
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

    // Get assigned subjects for this class
    const assignedClassSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    });

    // Get all schemes of work recorded for this class + term
    const schemes = await prisma.schemeOfWork.findMany({
      where: {
        schoolId,
        classId,
        termId,
        ...(approvedOnly ? { status: "Approved" } : {}),
      },
      include: {
        class: true,
        subject: true,
        term: true,
        teacher: true,
      },
    });

    const schemeMap = new Map(schemes.map((s) => [s.subjectId, s]));

    const subjectsData = assignedClassSubjects.map((cs) => {
      const scheme = schemeMap.get(cs.subjectId);
      return {
        subjectId: cs.subjectId,
        subjectName: cs.subject.name,
        subjectCode: cs.subject.code,
        hasSchemeOfWork: !!scheme,
        schemeOfWork: scheme ? this.mapToResponse(scheme) : null,
      };
    });

    return successResponse(
      {
        classId: classEntity.id,
        className: `${classEntity.name} ${classEntity.arm}`.trim(),
        termId: term.id,
        termName: term.termNumber,
        sessionName: term.academicSession.name,
        totalSubjects: subjectsData.length,
        subjectsWithScheme: schemes.length,
        subjects: subjectsData,
      },
      "Class schemes of work retrieved successfully."
    );
  }

  /**
   * Get schemes of work for the authenticated student's class.
   * Returns ONLY approved schemes of work.
   */
  static async getMySchemes(schoolId: string, userId: string, termId?: string) {
    const student = await prisma.student.findFirst({
      where: { userId, schoolId },
    });

    if (!student || !student.classId) {
      return failResponse("Student profile or assigned class not found.");
    }

    let targetTermId = termId;

    if (!targetTermId) {
      const currentSession = await prisma.academicSession.findFirst({
        where: { schoolId, isCurrent: true },
      });
      const currentTerm = currentSession
        ? await prisma.term.findFirst({
            where: { academicSessionId: currentSession.id, isCurrent: true },
          })
        : null;

      if (!currentTerm) {
        return failResponse("No active term found.");
      }
      targetTermId = currentTerm.id;
    }

    return this.getClassSchemes(schoolId, student.classId, targetTermId, true);
  }
}
