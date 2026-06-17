import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class DashboardService {

  static async getSchoolDashboard(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { plan: true },
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
      subscriptionPlan: school.plan?.name || "Free",
      totalStudents,
      totalTeachers,
      totalFaculty: totalTeachers,
      totalClasses,
      totalSubjects,
      maxStudents: school.plan?.maxStudents ?? 100,
      maxTeachers: school.plan?.maxTeachers ?? 20,
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

    const plans = await prisma.paymentPlan.findMany({
      include: {
        _count: {
          select: { schools: true },
        },
      },
    });

    const freeSchoolsCount = await prisma.school.count({
      where: { planId: null },
    });

    const planBreakdown: Record<string, number> = {};
    planBreakdown["Free"] = freeSchoolsCount;
    for (const p of plans) {
      planBreakdown[p.name] = p._count.schools;
    }

    return successResponse({
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalStudentsAcrossSchools,
      totalTeachersAcrossSchools,
      planBreakdown,
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
