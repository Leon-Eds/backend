import { prisma } from "../config/db";
import { hashPassword } from "../utils/bcrypt";
import { successResponse, failResponse, createPagedResult } from "../utils/response";
import { emailService } from "../utils/email";

export class TeacherService {
  private static getPlanLimits(plan: "Free" | "Plus" | "Premium") {
    switch (plan) {
      case "Plus":
        return 30;
      case "Premium":
        return 999999;
      case "Free":
      default:
        return 20;
    }
  }

  private static mapToResponse(t: any) {
    return {
      id: t.id,
      userId: t.userId,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      isActive: t.isActive,
      createdAt: t.createdAt,
      assignments: t.subjectAssignments
        ? t.subjectAssignments.map((a: any) => ({
            id: a.id,
            subjectId: a.subjectId,
            subjectName: a.subject?.name || "",
            classId: a.classId,
            className: a.class ? `${a.class.name} ${a.class.arm}`.trim() : "",
          }))
        : [],
    };
  }

  static async getTeachers(schoolId: string, params: any) {
    const isAll = params.all === "true" || params.pageSize === "0" || params.pageSize === 0;
    const search = params.search ? params.search.toLowerCase() : "";

    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.teacher.count({ where });

    const pageNumber = isAll ? 1 : parseInt(params.pageNumber || "1", 10);
    const pageSize = isAll ? (totalCount || 1) : parseInt(params.pageSize || "20", 10);

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(isAll ? {} : {
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      include: {
        subjectAssignments: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    const items = teachers.map((t) => this.mapToResponse(t));
    const pagedResult = createPagedResult(items, totalCount, pageNumber, pageSize);

    return successResponse(pagedResult);
  }

  static async getTeacherById(schoolId: string, teacherId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      include: {
        subjectAssignments: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!teacher) {
      return failResponse("Teacher not found.");
    }

    return successResponse(this.mapToResponse(teacher));
  }

  static async createTeacher(schoolId: string, request: any) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        teachers: { select: { isActive: true } },
      },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const activeCount = school.teachers.filter((t) => t.isActive).length;
    const maxTeachers = this.getPlanLimits(school.subscriptionPlan);

    if (activeCount >= maxTeachers) {
      return failResponse(
        `Teacher limit reached. Your ${school.subscriptionPlan} plan allows max ${maxTeachers} teachers. Upgrade your plan.`
      );
    }

    const emailInUse = await prisma.user.findUnique({
      where: { email: request.email.toLowerCase() },
    });

    if (emailInUse) {
      return failResponse("Email already in use.");
    }

    const hashedPassword = await hashPassword(request.password);

    const user = await prisma.user.create({
      data: {
        schoolId,
        name: request.fullName,
        email: request.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: "Teacher",
        isActive: true,
        isVerified: true,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        schoolId,
        userId: user.id,
        fullName: request.fullName,
        email: request.email.toLowerCase(),
        phone: request.phone || "",
        isActive: true,
      },
      include: {
        subjectAssignments: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    // Send teacher onboarding email asynchronously
    emailService.sendTeacherWelcomeEmail(
      teacher.email,
      teacher.fullName,
      school.name,
      teacher.email,
      request.password
    ).catch((err) => console.error("[TeacherService] Onboarding email error:", err));

    return successResponse(this.mapToResponse(teacher), "Teacher created successfully.");
  }

  static async updateTeacher(schoolId: string, teacherId: string, request: any) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      include: {
        subjectAssignments: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!teacher) {
      return failResponse("Teacher not found.");
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        fullName: request.fullName !== undefined ? request.fullName : undefined,
        phone: request.phone !== undefined ? request.phone : undefined,
      },
      include: {
        subjectAssignments: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (request.fullName !== undefined && teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { name: request.fullName },
      });
    }

    return successResponse(this.mapToResponse(updatedTeacher), "Teacher updated successfully.");
  }

  static async updateTeacherStatus(schoolId: string, teacherId: string, isActive: boolean) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      return failResponse("Teacher not found.");
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: { isActive },
    });

    if (teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { isActive },
      });
    }

    const message = isActive ? "Teacher activated." : "Teacher deactivated.";
    return successResponse(true, message);
  }

  static async assignTeacher(schoolId: string, teacherId: string, request: any) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      return failResponse("Teacher not found.");
    }

    const subject = await prisma.subject.findFirst({
      where: { id: request.subjectId, schoolId },
    });

    if (!subject) {
      return failResponse("Subject not found.");
    }

    const classEntity = await prisma.class.findFirst({
      where: { id: request.classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const assignmentExists = await prisma.teacherSubjectAssignment.findFirst({
      where: {
        teacherId,
        subjectId: request.subjectId,
        classId: request.classId,
      },
    });

    if (assignmentExists) {
      return failResponse("This assignment already exists.");
    }

    const assignment = await prisma.teacherSubjectAssignment.create({
      data: {
        teacherId,
        subjectId: request.subjectId,
        classId: request.classId,
      },
    });

    return successResponse(
      {
        id: assignment.id,
        subjectId: subject.id,
        subjectName: subject.name,
        classId: classEntity.id,
        className: `${classEntity.name} ${classEntity.arm}`.trim(),
      },
      "Teacher assigned successfully."
    );
  }

  static async removeAssignment(schoolId: string, assignmentId: string) {
    const assignment = await prisma.teacherSubjectAssignment.findFirst({
      where: {
        id: assignmentId,
        teacher: { schoolId },
      },
    });

    if (!assignment) {
      return failResponse("Assignment not found.");
    }

    await prisma.teacherSubjectAssignment.delete({
      where: { id: assignmentId },
    });

    return successResponse(true, "Assignment removed.");
  }
}
