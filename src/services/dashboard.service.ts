import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class DashboardService {
  private static getMaxTeachers(plan: string): number {
    switch (plan) {
      case "Free":
        return 20;
      case "Plus":
        return 30;
      case "Premium":
        return 999999; // Using 999999 to represent infinite/unlimited
      default:
        return 20;
    }
  }

  private static getMaxStudents(plan: string): number {
    switch (plan) {
      case "Free":
        return 100;
      case "Plus":
        return 200;
      case "Premium":
        return 999999;
      default:
        return 100;
    }
  }

  static async getSchoolDashboard(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
    });

    const currentTerm = currentSession
      ? await prisma.term.findFirst({
          where: { academicSessionId: currentSession.id, isCurrent: true },
        })
      : null;

    const totalStudents = await prisma.student.count({
      where: { schoolId, status: "Active" },
    });

    const totalTeachers = await prisma.teacher.count({
      where: { schoolId, isActive: true },
    });

    const totalClasses = await prisma.class.count({
      where: { schoolId },
    });

    const totalSubjects = await prisma.subject.count({
      where: { schoolId },
    });

    const pendingResults = await prisma.result.count({
      where: {
        schoolId,
        status: { in: ["Draft", "Submitted"] },
        ...(currentTerm ? { termId: currentTerm.id } : {}),
      },
    });

    let termProgress = 0;
    if (currentTerm) {
      const start = currentTerm.startDate.getTime();
      const end = currentTerm.endDate.getTime();
      const now = Date.now();
      if (end > start) {
        const progress = ((now - start) / (end - start)) * 100;
        termProgress = Math.max(0, Math.min(100, Math.round(progress)));
      }
    }

    return successResponse({
      schoolId: school.id,
      schoolName: school.name,
      subscriptionPlan: school.subscriptionPlan,
      totalStudents,
      totalTeachers,
      totalFaculty: totalTeachers,
      totalClasses,
      totalSubjects,
      maxStudents: this.getMaxStudents(school.subscriptionPlan),
      maxTeachers: this.getMaxTeachers(school.subscriptionPlan),
      currentSession: currentSession?.name || null,
      currentTerm: currentTerm?.termNumber || null,
      pendingResults,
      termProgress,
    });
  }

  static async getSuperAdminDashboard() {
    const totalSchools = await prisma.school.count();
    const activeSchools = await prisma.school.count({ where: { isActive: true } });
    const suspendedSchools = await prisma.school.count({ where: { isActive: false } });

    const totalStudentsAcrossSchools = await prisma.student.count({
      where: { status: "Active" },
    });

    const totalTeachersAcrossSchools = await prisma.teacher.count({
      where: { isActive: true },
    });

    const freeSchools = await prisma.school.count({
      where: { subscriptionPlan: "Free" },
    });

    const plusSchools = await prisma.school.count({
      where: { subscriptionPlan: "Plus" },
    });

    const premiumSchools = await prisma.school.count({
      where: { subscriptionPlan: "Premium" },
    });

    return successResponse({
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalStudentsAcrossSchools,
      totalTeachersAcrossSchools,
      planBreakdown: {
        freeSchools,
        plusSchools,
        premiumSchools,
      },
    });
  }

  static async getTeacherDashboard(schoolId: string, userId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
      include: {
        subjectAssignments: {
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
        },
      },
    });

    if (!teacher) {
      return failResponse("Teacher profile not found.");
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
    });

    const currentTerm = currentSession
      ? await prisma.term.findFirst({
          where: { academicSessionId: currentSession.id, isCurrent: true },
        })
      : null;

    const assignments = teacher.subjectAssignments.map((a) => ({
      id: a.id,
      subjectId: a.subjectId,
      subjectName: a.subject ? a.subject.name : "",
      classId: a.classId,
      className: a.class ? `${a.class.name} ${a.class.arm}`.trim() : "",
      studentCount: a.class?.students?.length || 0,
    }));

    const distinctSubjectIds = new Set(assignments.map((a) => a.subjectId));
    const distinctClassIds = new Set(assignments.map((a) => a.classId));

    // Total unique students across all assigned classes
    const totalStudents = await prisma.student.count({
      where: {
        schoolId,
        status: "Active",
        classId: { in: Array.from(distinctClassIds) },
      },
    });

    return successResponse({
      teacherId: teacher.id,
      fullName: teacher.fullName,
      profilePictureUrl: teacher.profilePictureUrl || "",
      totalAssignedSubjects: distinctSubjectIds.size,
      totalAssignedClasses: distinctClassIds.size,
      totalStudents,
      currentSession: currentSession?.name || null,
      currentTerm: currentTerm?.termNumber || null,
      assignments,
    });
  }

  static async getStudentDashboard(schoolId: string, userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, schoolId },
      include: { class: true },
    });

    if (!student) {
      return failResponse("Student profile not found.");
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
    });

    const currentTerm = currentSession
      ? await prisma.term.findFirst({
          where: { academicSessionId: currentSession.id, isCurrent: true },
        })
      : null;

    return successResponse({
      studentId: student.id,
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
      className: student.class ? student.class.name : null,
      classArm: student.class ? student.class.arm : null,
      currentSession: currentSession?.name || null,
      currentTerm: currentTerm?.termNumber || null,
    });
  }
}
