import { prisma } from "../config/db";
import { hashPassword } from "../utils/bcrypt";
import { successResponse, failResponse, createPagedResult } from "../utils/response";
import crypto from "crypto";
import { emailService } from "../utils/email";

export class StudentService {

  private static mapToResponse(s: any) {
    const parent = s.parent || null;
    return {
      id: s.id,
      fullName: s.fullName,
      admissionNumber: s.admissionNumber,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      profilePictureUrl: s.profilePictureUrl || "",
      // Backward-compatible flat fields
      parentName: parent?.fullName || "",
      parentPhone: parent?.phone || "",
      parentEmail: parent?.email || "",
      // New parent object with full details
      parent: parent ? {
        id: parent.id,
        fullName: parent.fullName,
        email: parent.email,
        phone: parent.phone,
        passportUrl: parent.passportUrl || "",
        idNumber: parent.idNumber || "",
      } : null,
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

  /**
   * Find an existing parent by email within a school, or create a new one.
   */
  private static async findOrCreateParent(
    schoolId: string,
    data: { parentName: string; parentEmail: string; parentPhone?: string; parentPassportUrl?: string; parentIdNumber?: string }
  ) {
    if (!data.parentEmail || data.parentEmail.trim() === "") {
      return null;
    }

    const email = data.parentEmail.trim().toLowerCase();

    // Check if parent already exists in this school
    let parent = await prisma.parent.findUnique({
      where: {
        schoolId_email: {
          schoolId,
          email,
        },
      },
    });

    if (parent) {
      // Update parent details if new info is provided
      const updateData: any = {};
      if (data.parentName && data.parentName.trim() !== "" && data.parentName !== parent.fullName) {
        updateData.fullName = data.parentName;
      }
      if (data.parentPhone !== undefined && data.parentPhone !== parent.phone) {
        updateData.phone = data.parentPhone;
      }
      if (data.parentPassportUrl !== undefined && data.parentPassportUrl !== parent.passportUrl) {
        updateData.passportUrl = data.parentPassportUrl;
      }
      if (data.parentIdNumber !== undefined && data.parentIdNumber !== parent.idNumber) {
        updateData.idNumber = data.parentIdNumber;
      }

      if (Object.keys(updateData).length > 0) {
        parent = await prisma.parent.update({
          where: { id: parent.id },
          data: updateData,
        });
      }

      return parent;
    }

    // Create new parent
    parent = await prisma.parent.create({
      data: {
        schoolId,
        fullName: data.parentName || "",
        email,
        phone: data.parentPhone || "",
        passportUrl: data.parentPassportUrl || "",
        idNumber: data.parentIdNumber || "",
      },
    });

    return parent;
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
        parent: true,
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
        parent: true,
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

    // 4. Find or create parent record
    const parent = await this.findOrCreateParent(schoolId, {
      parentName: request.parentName || "",
      parentEmail: request.parentEmail || "",
      parentPhone: request.parentPhone || "",
      parentPassportUrl: request.parentPassportUrl || "",
      parentIdNumber: request.parentIdNumber || "",
    });

    // Handle date parsing safely
    const dob = request.dateOfBirth ? new Date(request.dateOfBirth) : null;

    const student = await prisma.student.create({
      data: {
        schoolId,
        userId: user.id,
        parentId: parent?.id || null,
        fullName: request.fullName,
        admissionNumber: admNo,
        gender: request.gender,
        dateOfBirth: dob,
        classId: request.classId || null,
        profilePictureUrl: request.profilePictureUrl || "",
        status: "Active",
        arm: request.arm || null,
        bloodGroup: request.bloodGroup || null,
      },
      include: {
        class: true,
        user: true,
        parent: true,
      },
    });

    // Send student/parent onboarding email asynchronously
    const parentEmail = parent?.email || "";
    const parentName = parent?.fullName || "";
    if (parentEmail && parentEmail.trim() !== "") {
      emailService.sendStudentWelcomeEmail(
        parentEmail,
        parentName,
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
      include: { user: true, parent: true },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    // Handle parent update: if parent details are provided, find-or-create/update
    let newParentId = undefined; // undefined = don't change
    const hasParentUpdate = request.parentName !== undefined ||
      request.parentEmail !== undefined ||
      request.parentPhone !== undefined ||
      request.parentPassportUrl !== undefined ||
      request.parentIdNumber !== undefined;

    if (hasParentUpdate) {
      const parentEmail = request.parentEmail !== undefined
        ? request.parentEmail
        : (student.parent?.email || "");
      const parentName = request.parentName !== undefined
        ? request.parentName
        : (student.parent?.fullName || "");
      const parentPhone = request.parentPhone !== undefined
        ? request.parentPhone
        : (student.parent?.phone || "");
      const parentPassportUrl = request.parentPassportUrl !== undefined
        ? request.parentPassportUrl
        : (student.parent?.passportUrl || "");
      const parentIdNumber = request.parentIdNumber !== undefined
        ? request.parentIdNumber
        : (student.parent?.idNumber || "");

      if (parentEmail && parentEmail.trim() !== "") {
        const parent = await this.findOrCreateParent(schoolId, {
          parentName,
          parentEmail,
          parentPhone,
          parentPassportUrl,
          parentIdNumber,
        });
        newParentId = parent?.id || null;
      } else {
        // Email cleared — unlink parent
        newParentId = null;
      }
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
        status: request.status !== undefined ? request.status : undefined,
        arm: request.arm !== undefined ? request.arm : undefined,
        bloodGroup: request.bloodGroup !== undefined ? request.bloodGroup : undefined,
        parentId: newParentId,
      },
      include: {
        class: true,
        user: true,
        parent: true,
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
        parent: true,
      },
    });

    const items = students.map((s) => this.mapToResponse(s));
    return successResponse(items);
  }

  static async resetStudentPassword(schoolId: string, studentId: string, newPassword: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    if (!student.userId) {
      return failResponse("Student does not have an associated user account.");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: student.userId },
      data: { passwordHash: hashedPassword },
    });

    return successResponse({
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
    }, "Student password has been reset successfully.");
  }
}
