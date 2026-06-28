import { prisma } from "../config/db";
import { successResponse, failResponse, createPagedResult } from "../utils/response";

export class SchoolService {
  private static mapToResponse(school: any) {
    const currentTeacherCount = school.teachers ? school.teachers.filter((t: any) => t.isActive).length : 0;
    const currentStudentCount = school.students ? school.students.filter((s: any) => s.status === "Active").length : 0;

    return {
      id: school.id,
      name: school.name,
      address: school.address,
      contactEmail: school.contactEmail,
      contactPhone: school.contactPhone,
      logoUrl: school.logoUrl,
      schoolTheme: school.schoolTheme,
      slug: school.slug,
      subscriptionPlan: school.plan?.name || "Free",
      subscriptionStatus: school.subscriptionStatus,
      subscriptionEndedAt: school.subscriptionEndedAt,
      isActive: school.isActive,
      maxTeachers: school.plan?.maxTeachers ?? 20,
      maxStudents: school.plan?.maxStudents ?? 100,
      currentTeacherCount,
      currentStudentCount,
      createdAt: school.createdAt,
    };
  }

  static async getAllSchools(params: any) {
    const pageNumber = parseInt(params.pageNumber || "1", 10);
    const pageSize = parseInt(params.pageSize || "20", 10);
    const search = params.search ? params.search.toLowerCase() : "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.school.count({ where });

    const schools = await prisma.school.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      include: {
        teachers: { select: { isActive: true } },
        students: { select: { status: true } },
        plan: true,
      },
    });

    const items = schools.map((s) => this.mapToResponse(s));
    const pagedResult = createPagedResult(items, totalCount, pageNumber, pageSize);

    return successResponse(pagedResult);
  }

  static async getSchoolById(id: string) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        teachers: { select: { isActive: true } },
        students: { select: { status: true } },
        plan: true,
      },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    return successResponse(this.mapToResponse(school));
  }

  static async updateSchool(id: string, request: any) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        teachers: { select: { isActive: true } },
        students: { select: { status: true } },
      },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: {
        name: request.name !== undefined ? request.name : undefined,
        address: request.address !== undefined ? request.address : undefined,
        contactEmail: request.contactEmail !== undefined ? request.contactEmail : undefined,
        contactPhone: request.contactPhone !== undefined ? request.contactPhone : undefined,
        logoUrl: request.logoUrl !== undefined ? request.logoUrl : undefined,
        schoolTheme: request.schoolTheme !== undefined ? request.schoolTheme : undefined,
      },
      include: {
        teachers: { select: { isActive: true } },
        students: { select: { status: true } },
        plan: true,
      },
    });

    return successResponse(this.mapToResponse(updatedSchool), "School updated successfully.");
  }

  static async updateSchoolPlan(schoolId: string, planId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        teachers: { select: { isActive: true } },
        students: { select: { status: true } },
        plan: true,
      },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: { planId },
      include: {
        teachers: { select: { isActive: true } },
        students: { select: { status: true } },
        plan: true,
      },
    });

    return successResponse(this.mapToResponse(updatedSchool), "Subscription plan updated successfully.");
  }

  static async updateSchoolStatus(schoolId: string, isActive: boolean) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        isActive,
        subscriptionStatus: isActive ? "Active" : "Suspended",
      },
    });

    const message = isActive ? "School activated successfully." : "School suspended successfully.";
    return successResponse(true, message);
  }

  static async getSubscriptionPlans() {
    const plans = await prisma.paymentPlan.findMany({
      where: { isActive: true },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      amount: p.amount,
      maxTeachers: p.maxTeachers,
      maxStudents: p.maxStudents,
      description: `${p.name} plan supporting up to ${
        p.maxTeachers >= 999999 ? "unlimited" : p.maxTeachers
      } teachers and ${p.maxStudents >= 999999 ? "unlimited" : p.maxStudents} students.`,
    }));
  }
}
