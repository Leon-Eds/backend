import { prisma } from "../config/db";
import { hashPassword } from "../utils/bcrypt";
import { successResponse, failResponse, createPagedResult } from "../utils/response";
import crypto from "crypto";
import { emailService } from "../utils/email";

export class StudentService {

  private static mapToResponse(s: any) {
    return {
      id: s.id,
      fullName: s.fullName,
      admissionNumber: s.admissionNumber,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      profilePictureUrl: s.profilePictureUrl || "",
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail,
      status: s.status,
      classId: s.classId,
      className: s.class ? `${s.class.name} ${s.class.arm}`.trim() : null,
      enrolledAt: s.enrolledAt,
      createdAt: s.enrolledAt, // map enrolledAt to createdAt for frontend UI
      systemEmail: s.user?.email || null,
      arm: s.arm || null,
      bloodGroup: s.bloodGroup || null,
    };
  }

  static async getStudents(schoolId: string, params: any) {
    const isAll = params.all === "true" || params.pageSize === "0" || params.pageSize === 0;
    const search = params.search ? params.search.toLowerCase() : "";

    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { admissionNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.student.count({ where });

    const pageNumber = isAll ? 1 : parseInt(params.pageNumber || "1", 10);
    const pageSize = isAll ? (totalCount || 1) : parseInt(params.pageSize || "20", 10);

    const students = await prisma.student.findMany({
      where,
      orderBy: { enrolledAt: "desc" },
      ...(isAll ? {} : {
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
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
        plan: true,
      },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const activeCount = school.students.filter((s) => s.status === "Active").length;
    const maxStudents = school.plan?.maxStudents ?? 100;

    if (activeCount >= maxStudents) {
      const planName = school.plan?.name || "Free";
      return failResponse(
        `Student limit reached. Your ${planName} plan allows max ${maxStudents} students. Upgrade your plan.`
      );
    }

    // 1. Generate prefix based on school initials & differentiator
    function getSchoolInitials(name: string): string {
      const words = name.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 3) {
        return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
      } else if (words.length === 2) {
        return (words[0][0] + words[1][0] + (words[1][1] || "X")).toUpperCase();
      } else {
        return name.substring(0, 3).padEnd(3, "X").toUpperCase();
      }
    }

    const baseInitials = getSchoolInitials(school.name);

    // Find all schools sorted by createdAt to deterministically resolve differentiator
    const allSchools = await prisma.school.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true }
    });

    const matchingSchools = allSchools.filter(s => getSchoolInitials(s.name) === baseInitials);
    const schoolIndex = matchingSchools.findIndex(s => s.id === school.id);
    const prefix = schoolIndex <= 0 ? baseInitials : `${baseInitials}${schoolIndex + 1}`;

    // 2. Generate incremental sequence number for current year
    const year = new Date().getFullYear();
    const studentsInYear = await prisma.student.findMany({
      where: {
        schoolId,
        admissionNumber: {
          startsWith: `${prefix}-${year}-`
        }
      },
      select: { admissionNumber: true }
    });

    let nextNum = 1;
    if (studentsInYear.length > 0) {
      const numbers = studentsInYear.map(s => {
        const parts = s.admissionNumber.split("-");
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        return isNaN(num) ? 0 : num;
      });
      nextNum = Math.max(...numbers) + 1;
    }

    const seq = String(nextNum).padStart(4, "0");
    const admNo = `${prefix}-${year}-${seq}`;

    // 3. Generate globally unique Student User login email based on Admission Number
    const loginEmail = `${admNo.toLowerCase()}@student.leoned.com`;

    const emailExists = await prisma.user.findFirst({
      where: { email: loginEmail },
    });

    if (emailExists) {
      return failResponse("A student account with this admission number already exists.");
    }

    const rawPassword = request.password && request.password.trim() ? request.password.trim() : "Student@123!";
    const hashedPassword = await hashPassword(rawPassword);
    const user = await prisma.user.create({
      data: {
        schoolId,
        name: request.fullName,
        email: loginEmail,
        passwordHash: hashedPassword,
        role: "Student",
        isActive: true,
        isVerified: true,
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
        profilePictureUrl: request.profilePictureUrl || "",
        parentName: request.parentName || "",
        parentPhone: request.parentPhone || "",
        parentEmail: request.parentEmail || "",
        status: "Active",
        arm: request.arm || null,
        bloodGroup: request.bloodGroup || null,
      },
      include: {
        class: true,
        user: true,
      },
    });

    // Send student/parent onboarding email asynchronously
    if (student.parentEmail && student.parentEmail.trim() !== "") {
      emailService.sendStudentWelcomeEmail(
        student.parentEmail,
        student.parentName,
        student.fullName,
        school.name,
        admNo, // Pass admission number as systemEmail so it displays as the Login ID
        admNo,
        rawPassword
      ).catch((err) => console.error("[StudentService] Onboarding email error:", err));
    }

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
        profilePictureUrl: request.profilePictureUrl !== undefined ? request.profilePictureUrl : undefined,
        parentName: request.parentName !== undefined ? request.parentName : undefined,
        parentPhone: request.parentPhone !== undefined ? request.parentPhone : undefined,
        parentEmail: request.parentEmail !== undefined ? request.parentEmail : undefined,
        status: request.status !== undefined ? request.status : undefined,
        arm: request.arm !== undefined ? request.arm : undefined,
        bloodGroup: request.bloodGroup !== undefined ? request.bloodGroup : undefined,
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
