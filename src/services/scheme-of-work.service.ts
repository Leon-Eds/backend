import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { TeacherPortalService } from "./teacher-portal.service";

export class SchemeOfWorkService {
  private static async resolveTeacher(schoolId: string, userId: string) {
    return prisma.teacher.findFirst({
      where: { userId, schoolId },
    });
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

    const scheme = await prisma.schemeOfWork.create({
      data: {
        schoolId,
        classId,
        subjectId,
        termId,
        teacherId,
        topics: topics as any,
      },
      include: {
        class: true,
        subject: true,
        term: true,
        teacher: true,
      },
    });

    return successResponse(
      {
        id: scheme.id,
        classId: scheme.classId,
        className: `${scheme.class.name} ${scheme.class.arm}`.trim(),
        subjectId: scheme.subjectId,
        subjectName: scheme.subject.name,
        termId: scheme.termId,
        teacherName: scheme.teacher.fullName,
        topics: scheme.topics,
        createdAt: scheme.createdAt,
      },
      "Scheme of work created successfully."
    );
  }

  /**
   * Update an existing Scheme of Work.
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
        // Also check if assigned
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
    }

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

    return successResponse(
      {
        id: updated.id,
        classId: updated.classId,
        className: `${updated.class.name} ${updated.class.arm}`.trim(),
        subjectId: updated.subjectId,
        subjectName: updated.subject.name,
        termId: updated.termId,
        teacherName: updated.teacher.fullName,
        topics: updated.topics,
        updatedAt: updated.updatedAt,
      },
      "Scheme of work updated successfully."
    );
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
      {
        id: scheme.id,
        classId: scheme.classId,
        className: `${scheme.class.name} ${scheme.class.arm}`.trim(),
        subjectId: scheme.subjectId,
        subjectName: scheme.subject.name,
        termId: scheme.termId,
        termName: scheme.term.termNumber,
        sessionName: scheme.term.academicSession.name,
        teacherName: scheme.teacher.fullName,
        topics: scheme.topics,
        createdAt: scheme.createdAt,
        updatedAt: scheme.updatedAt,
      },
      "Scheme of work retrieved."
    );
  }

  /**
   * Get ALL schemes of work for a class in a given term (Student / Teacher / Admin view).
   * Returns all assigned subjects in the class with their scheme of work (if uploaded).
   */
  static async getClassSchemes(schoolId: string, classId: string, termId: string) {
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
      where: { schoolId, classId, termId },
      include: {
        subject: true,
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
        schemeOfWork: scheme
          ? {
              id: scheme.id,
              teacherId: scheme.teacherId,
              teacherName: scheme.teacher.fullName,
              topics: scheme.topics,
              createdAt: scheme.createdAt,
              updatedAt: scheme.updatedAt,
            }
          : null,
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
}
