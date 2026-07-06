import { prisma } from "../config/db";
import { successResponse, failResponse, createPagedResult } from "../utils/response";
import { hashPassword } from "../utils/bcrypt";
import { emailService } from "../utils/email";

export class BursarService {

  /**
   * Create a new Bursar user
   */
  static async createBursar(schoolId: string, request: any) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
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
        role: "Bursar",
        isActive: true,
        isVerified: true,
      },
    });

    // Send welcome email asynchronously
    emailService.sendBursarWelcomeEmail(
      user.email,
      user.name,
      school.name,
      user.email,
      request.password
    ).catch((err) => console.error("[BursarService] Onboarding email error:", err));

    return successResponse({
      id: user.id,
      fullName: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }, "Bursar created successfully.");
  }

  /**
   * Get fee status for a single student in a term
   */
  static async getStudentFeeStatus(schoolId: string, studentId: string, termId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    const fee = await prisma.feePayment.findFirst({
      where: { schoolId, studentId, termId },
    });

    if (!fee) {
      return successResponse({
        studentId,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        amountDue: 0,
        amountPaid: 0,
        balance: 0,
        status: "NotRecorded",
        isCleared: false,
      }, "No fee record found for this term.");
    }

    const amountDue = Number(fee.amountDue);
    const amountPaid = Number(fee.amountPaid);
    return successResponse({
      id: fee.id,
      studentId: fee.studentId,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      amountDue,
      amountPaid,
      balance: amountDue - amountPaid,
      status: fee.status,
      isCleared: fee.status === "Cleared",
      receiptImageUrl: fee.receiptImageUrl || "",
      description: fee.description || "",
      clearedAt: fee.clearedAt,
    }, "Fee status retrieved.");
  }

  /**
   * Get class fee overview with list of students paid/owing
   */
  static async getClassFeeOverview(schoolId: string, classId: string, termId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const students = await prisma.student.findMany({
      where: { schoolId, classId, status: "Active" },
      orderBy: { fullName: "asc" },
    });

    const fees = await prisma.feePayment.findMany({
      where: { schoolId, termId },
    });

    const studentFees = students.map((student) => {
      const fee = fees.find((f) => f.studentId === student.id);
      if (fee) {
        const amountDue = Number(fee.amountDue);
        const amountPaid = Number(fee.amountPaid);
        return {
          studentId: student.id,
          studentName: student.fullName,
          admissionNumber: student.admissionNumber,
          amountDue,
          amountPaid,
          balance: amountDue - amountPaid,
          status: fee.status,
          isCleared: fee.status === "Cleared",
          receiptImageUrl: fee.receiptImageUrl || "",
          description: fee.description || "",
        };
      }
      return {
        studentId: student.id,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        amountDue: 0,
        amountPaid: 0,
        balance: 0,
        status: "NotRecorded",
        isCleared: false,
        receiptImageUrl: "",
        description: "",
      };
    });

    const totalStudents = studentFees.length;
    const clearedCount = studentFees.filter((f) => f.isCleared).length;
    const owingCount = totalStudents - clearedCount;
    const totalAmountDue = studentFees.reduce((sum, f) => sum + f.amountDue, 0);
    const totalAmountPaid = studentFees.reduce((sum, f) => sum + f.amountPaid, 0);

    return successResponse({
      classId: classEntity.id,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      totalStudents,
      clearedCount,
      owingCount,
      totalAmountDue,
      totalAmountPaid,
      students: studentFees,
    }, "Class fee overview retrieved.");
  }

  /**
   * Record a fee payment (Bursar or SchoolAdmin)
   */
  static async recordPayment(schoolId: string, request: any) {
    const student = await prisma.student.findFirst({
      where: { id: request.studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found in this school.");
    }

    const existing = await prisma.feePayment.findFirst({
      where: {
        schoolId,
        studentId: request.studentId,
        termId: request.termId,
      },
    });

    const status = request.amountPaid >= request.amountDue ? "Cleared" : "Pending";
    let feeRecord;

    if (existing) {
      feeRecord = await prisma.feePayment.update({
        where: { id: existing.id },
        data: {
          amountDue: request.amountDue,
          amountPaid: request.amountPaid,
          receiptImageUrl: request.receiptImageUrl || existing.receiptImageUrl,
          description: request.description || existing.description,
          status,
          clearedAt: status === "Cleared" ? (existing.clearedAt ? existing.clearedAt : new Date()) : null,
        },
      });
    } else {
      feeRecord = await prisma.feePayment.create({
        data: {
          schoolId,
          studentId: request.studentId,
          termId: request.termId,
          academicSessionId: request.academicSessionId,
          amountDue: request.amountDue,
          amountPaid: request.amountPaid,
          receiptImageUrl: request.receiptImageUrl || "",
          description: request.description || "",
          status,
          clearedAt: status === "Cleared" ? new Date() : null,
        },
      });
    }

    const amountDue = Number(feeRecord.amountDue);
    const amountPaid = Number(feeRecord.amountPaid);
    return successResponse({
      id: feeRecord.id,
      studentId: feeRecord.studentId,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      amountDue,
      amountPaid,
      balance: amountDue - amountPaid,
      status: feeRecord.status,
      isCleared: feeRecord.status === "Cleared",
      receiptImageUrl: feeRecord.receiptImageUrl,
      description: feeRecord.description,
    }, "Fee payment recorded.");
  }

  /**
   * Clear student fees for a term
   */
  static async clearStudent(schoolId: string, studentId: string, termId: string, clearedByUserId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    const fee = await prisma.feePayment.findFirst({
      where: { schoolId, studentId, termId },
    });

    let feeRecord;

    if (!fee) {
      const term = await prisma.term.findFirst({ where: { id: termId } });
      if (!term) return failResponse("Term not found.");

      feeRecord = await prisma.feePayment.create({
        data: {
          schoolId,
          studentId,
          termId,
          academicSessionId: term.academicSessionId,
          amountDue: 0,
          amountPaid: 0,
          status: "Cleared",
          clearedByUserId,
          clearedAt: new Date(),
        },
      });
    } else {
      feeRecord = await prisma.feePayment.update({
        where: { id: fee.id },
        data: {
          status: "Cleared",
          clearedByUserId,
          clearedAt: new Date(),
        },
      });
    }

    return successResponse({
      studentId,
      studentName: student.fullName,
      isCleared: true,
    }, "Student fee cleared.");
  }

  /**
   * School-wide fee report for a term — aggregate across all classes
   */
  static async getSchoolFeeReport(schoolId: string, termId: string) {
    const term = await prisma.term.findFirst({
      where: { id: termId },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: {
        students: { where: { status: "Active" } },
      },
      orderBy: { name: "asc" },
    });

    const fees = await prisma.feePayment.findMany({
      where: { schoolId, termId },
    });

    const classSummaries = classes.map((cls) => {
      const classStudentIds = cls.students.map((s) => s.id);
      const classFees = fees.filter((f) => classStudentIds.includes(f.studentId));

      const totalStudents = cls.students.length;
      const clearedCount = classFees.filter((f) => f.status === "Cleared").length;
      const owingCount = totalStudents - clearedCount;
      const totalCollected = classFees.reduce((sum, f) => sum + Number(f.amountPaid), 0);
      const totalExpected = classFees.reduce((sum, f) => sum + Number(f.amountDue), 0);

      return {
        classId: cls.id,
        className: `${cls.name} ${cls.arm}`.trim(),
        totalStudents,
        clearedCount,
        owingCount,
        totalExpected,
        totalCollected,
        outstanding: totalExpected - totalCollected,
      };
    });

    const grandTotalExpected = classSummaries.reduce((sum, c) => sum + c.totalExpected, 0);
    const grandTotalCollected = classSummaries.reduce((sum, c) => sum + c.totalCollected, 0);
    const grandTotalStudents = classSummaries.reduce((sum, c) => sum + c.totalStudents, 0);
    const grandTotalCleared = classSummaries.reduce((sum, c) => sum + c.clearedCount, 0);

    return successResponse({
      termName: term.termNumber,
      sessionName: term.academicSession.name,
      grandTotalStudents,
      grandTotalCleared,
      grandTotalOwing: grandTotalStudents - grandTotalCleared,
      grandTotalExpected,
      grandTotalCollected,
      grandTotalOutstanding: grandTotalExpected - grandTotalCollected,
      classes: classSummaries,
    }, "School fee report retrieved.");
  }
}
