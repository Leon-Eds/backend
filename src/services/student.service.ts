import { prisma } from "../config/db";
import { hashPassword } from "../utils/bcrypt";
import { successResponse, failResponse, createPagedResult } from "../utils/response";

export class StudentService {
  private static getPlanLimits(plan: "Free" | "Plus" | "Premium") {
    switch (plan) {
      case "Plus":
        return 200;
      case "Premium":
        return 999999;
      case "Free":
      default:
        return 100;
    }
  }

  private static mapToResponse(s: any) {
    return {
      id: s.id,
      fullName: s.fullName,
      admissionNumber: s.admissionNumber,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail,
      status: s.status,
      classId: s.classId,
      className: s.class ? `${s.class.name} ${s.class.arm}`.trim() : null,
      enrolledAt: s.enrolledAt,
      systemEmail: s.user?.email || null,
    };
  }

  static async getStudents(schoolId: string, params: any) {
    const pageNumber = parseInt(params.pageNumber || "1", 10);
    const pageSize = parseInt(params.pageSize || "20", 10);
    const search = params.search ? params.search.toLowerCase() : "";

    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { admissionNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.student.count({ where });

    const students = await prisma.student.findMany({
      where,
      orderBy: { enrolledAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      include: {
        class: true,
        user: true,
      },
    });

    const items = students.map((s) => this.mapToResponse(s));
    const pagedResult = createPagedResult(items, totalCount, pageNumber, pageSize);

    return successResponse(pagedResult);
  }

  static async getStudentById(schoolId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        class: true,
        user: true,
      },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    return successResponse(this.mapToResponse(student));
  }

  static async createStudent(schoolId: string, request: any) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        students: { select: { status: true } },
      },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const activeCount = school.students.filter((s) => s.status === "Active").length;
    const maxStudents = this.getPlanLimits(school.subscriptionPlan);

    if (activeCount >= maxStudents) {
      return failResponse(
        `Student limit reached. Your ${school.subscriptionPlan} plan allows max ${maxStudents} students. Upgrade your plan.`
      );
    }

    let admNo = request.admissionNumber;
    if (!admNo || !admNo.trim()) {
      const count = await prisma.student.count({ where: { schoolId } });
      const year = new Date().getFullYear();
      const seq = String(count + 1).padStart(4, "0");
      admNo = `ADM/${year}/${seq}`;
    } else {
      const existingAdm = await prisma.student.findFirst({
        where: { schoolId, admissionNumber: admNo },
      });
      if (existingAdm) {
        return failResponse("Admission number already exists in this school.");
      }
    }

    let systemEmail = `${admNo.replace(/\//g, "").toLowerCase()}@${school.slug}.leoned.com`;
    const emailExists = await prisma.user.findUnique({
      where: { email: systemEmail },
    });

    if (emailExists) {
      systemEmail = `${admNo.replace(/\//g, "").toLowerCase()}${crypto.randomUUID().slice(0, 4)}@${school.slug}.leoned.com`;
    }

    const hashedPassword = await hashPassword("Student@123!");

    const user = await prisma.user.create({
      data: {
        schoolId,
        name: request.fullName,
        email: systemEmail,
        passwordHash: hashedPassword,
        role: "Student",
        isActive: true,
      },
    });

    // Handle date parsing safely
    const dob = request.dateOfBirth ? new Date(request.dateOfBirth) : null;

    const student = await prisma.student.create({
      data: {
        schoolId,
        userId: user.id,
        fullName: request.fullName,
        admissionNumber: admNo,
        gender: request.gender,
        dateOfBirth: dob,
        classId: request.classId || null,
        parentName: request.parentName || "",
        parentPhone: request.parentPhone || "",
        parentEmail: request.parentEmail || "",
        status: "Active",
      },
      include: {
        class: true,
        user: true,
      },
    });

    return successResponse(this.mapToResponse(student), "Student created successfully.");
  }

  static async updateStudent(schoolId: string, studentId: string, request: any) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    const dob = request.dateOfBirth !== undefined ? (request.dateOfBirth ? new Date(request.dateOfBirth) : null) : undefined;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        fullName: request.fullName !== undefined ? request.fullName : undefined,
        gender: request.gender !== undefined ? request.gender : undefined,
        dateOfBirth: dob,
        classId: request.classId !== undefined ? request.classId : undefined,
        parentName: request.parentName !== undefined ? request.parentName : undefined,
        parentPhone: request.parentPhone !== undefined ? request.parentPhone : undefined,
        parentEmail: request.parentEmail !== undefined ? request.parentEmail : undefined,
        status: request.status !== undefined ? request.status : undefined,
      },
      include: {
        class: true,
        user: true,
      },
    });

    if (request.fullName !== undefined && student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { name: request.fullName },
      });
    }

    if (request.status !== undefined && student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: request.status === "Active" },
      });
    }

    return successResponse(this.mapToResponse(updatedStudent), "Student updated successfully.");
  }

  static async deleteStudent(schoolId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { status: "Archived" },
    });

    if (student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      });
    }

    return successResponse(true, "Student archived successfully.");
  }

  static async searchStudents(schoolId: string, query: string) {
    const search = query ? query.toLowerCase() : "";

    const students = await prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { admissionNumber: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { enrolledAt: "desc" },
      take: 20,
      include: {
        class: true,
        user: true,
      },
    });

    const items = students.map((s) => this.mapToResponse(s));
    return successResponse(items);
  }
}
