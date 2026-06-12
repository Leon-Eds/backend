import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

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
   * Returns the distinct classes assigned to the teacher, with subjects per class.
   */
  static async getMyClasses(schoolId: string, userId: string) {
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
            academicSession: true,
          },
        },
      },
    });

    // Group by classId
    const classMap = new Map<string, {
      classId: string;
      className: string;
      arm: string;
      studentCount: number;
      academicSession: string | null;
      subjects: { subjectId: string; subjectName: string }[];
    }>();

    for (const a of assignments) {
      if (!a.class) continue;
      const key = a.classId;

      if (!classMap.has(key)) {
        classMap.set(key, {
          classId: a.classId,
          className: `${a.class.name} ${a.class.arm}`.trim(),
          arm: a.class.arm,
          studentCount: a.class.students?.length || 0,
          academicSession: a.class.academicSession?.name || null,
          subjects: [],
        });
      }

      const entry = classMap.get(key)!;
      if (!entry.subjects.some((s) => s.subjectId === a.subjectId)) {
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
}
