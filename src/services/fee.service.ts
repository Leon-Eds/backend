import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { PdfGenerator } from "../utils/pdf-generator";

export class FeeService {
  private static mapToResponse(fee: any, student: any) {
    const amountDue = Number(fee.amountDue);
    const amountPaid = Number(fee.amountPaid);
    const balance = amountDue - amountPaid;
    return {
      id: fee.id,
      studentId: fee.studentId,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      amountDue,
      amountPaid,
      balance,
      status: fee.status,
      isCleared: fee.status === "Cleared",
      receiptImageUrl: fee.receiptImageUrl || "",
      description: fee.description || "",
      clearedAt: fee.clearedAt,
    };
  }

  static async recordPayment(schoolId: string, recordedByUserId: string, request: any) {
    const [student, term] = await Promise.all([
      prisma.student.findFirst({ where: { id: request.studentId, schoolId } }),
      prisma.term.findFirst({ where: { id: request.termId, academicSession: { schoolId } } }),
    ]);

    if (!student) {
      return failResponse("Student not found in this school.");
    }
    if (!term) return failResponse("Term not found in this school.");
    if (request.academicSessionId !== term.academicSessionId) {
      return failResponse("The selected term does not belong to the selected academic session.");
    }

    const existing = await prisma.feePayment.findFirst({
      where: {
        schoolId,
        studentId: request.studentId,
        termId: request.termId,
      },
    });

    const previousAmountPaid = existing ? Number(existing.amountPaid) : 0;
    if (request.amountPaid < previousAmountPaid) {
      return failResponse("Recorded payments cannot be reduced. Create an explicit reversal transaction instead.");
    }
    const paymentDelta = request.amountPaid - previousAmountPaid;
    const reference = request.reference?.trim() || null;
    if (reference && await prisma.feePaymentTransaction.findFirst({ where: { schoolId, reference } })) {
      return failResponse("Payment reference has already been recorded.");
    }

    const status = request.amountPaid >= request.amountDue ? "Cleared" : "Pending";
    const feeRecord = await prisma.$transaction(async (tx) => {
      const fee = existing
        ? await tx.feePayment.update({
            where: { id: existing.id },
            data: {
              amountDue: request.amountDue,
              amountPaid: request.amountPaid,
              receiptImageUrl: request.receiptImageUrl || existing.receiptImageUrl,
              description: request.description || existing.description,
              status,
              clearedAt: status === "Cleared" ? (existing.clearedAt || new Date()) : null,
            },
          })
        : await tx.feePayment.create({
            data: {
              schoolId,
              studentId: request.studentId,
              termId: request.termId,
              academicSessionId: term.academicSessionId,
              amountDue: request.amountDue,
              amountPaid: request.amountPaid,
              receiptImageUrl: request.receiptImageUrl || "",
              description: request.description || "",
              status,
              clearedAt: status === "Cleared" ? new Date() : null,
            },
          });

      if (paymentDelta > 0) {
        await tx.feePaymentTransaction.create({
          data: {
            schoolId,
            feePaymentId: fee.id,
            studentId: request.studentId,
            termId: request.termId,
            academicSessionId: term.academicSessionId,
            amount: paymentDelta,
            method: request.paymentMethod || "Manual",
            reference,
            description: request.description || "School fee payment",
            recordedByUserId,
          },
        });
      }

      return fee;
    });

    return successResponse(this.mapToResponse(feeRecord, student), "Fee payment recorded.");
  }

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
        receiptImageUrl: "",
        description: "",
        clearedAt: null,
      }, "No fee record found for this term.");
    }

    return successResponse(this.mapToResponse(fee, student), "Fee status retrieved.");
  }

  static async getClassFeeOverview(schoolId: string, classId: string, termId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const term = await prisma.term.findFirst({
      where: { id: termId, academicSession: { schoolId } },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const students = await prisma.student.findMany({
      where: { schoolId, classId, status: "Active" },
    });

    const fees = await prisma.feePayment.findMany({
      where: { schoolId, termId },
    });

    const studentFees = students.map((student) => {
      const fee = fees.find((f) => f.studentId === student.id);
      if (fee) {
        return this.mapToResponse(fee, student);
      }

      return {
        id: "00000000-0000-0000-0000-000000000000",
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
        clearedAt: null,
      };
    });

    const totalStudents = studentFees.length;
    const clearedCount = studentFees.filter((f) => f.isCleared).length;
    const pendingCount = totalStudents - clearedCount;
    const totalAmountDue = studentFees.reduce((sum, f) => sum + f.amountDue, 0);
    const totalAmountPaid = studentFees.reduce((sum, f) => sum + f.amountPaid, 0);

    return successResponse({
      classId: classEntity.id,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      termName: term.termNumber,
      totalStudents,
      clearedCount,
      pendingCount,
      totalAmountDue,
      totalAmountPaid,
      students: studentFees,
    }, "Class fee overview retrieved.");
  }

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
      const term = await prisma.term.findFirst({
        where: { id: termId, academicSession: { schoolId } },
      });

      if (!term) {
        return failResponse("Term not found.");
      }

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

    return successResponse(this.mapToResponse(feeRecord, student), "Student fee cleared.");
  }

  static async isStudentCleared(schoolId: string, studentId: string, termId: string): Promise<boolean> {
    const fee = await prisma.feePayment.findFirst({
      where: { schoolId, studentId, termId },
    });

    return fee?.status === "Cleared";
  }

  static async uploadReceipt(schoolId: string, userId: string, request: any) {
    const student = await prisma.student.findFirst({
      where: { userId, schoolId },
    });

    if (!student) {
      return failResponse("Student profile not found.");
    }

    const existing = await prisma.feePayment.findFirst({
      where: {
        schoolId,
        studentId: student.id,
        termId: request.termId,
      },
    });

    let feeRecord;

    if (existing) {
      feeRecord = await prisma.feePayment.update({
        where: { id: existing.id },
        data: {
          amountPaid: request.amountPaid,
          receiptImageUrl: request.receiptImageUrl,
          description: request.description || "",
          status: "Pending",
        },
      });
    } else {
      feeRecord = await prisma.feePayment.create({
        data: {
          schoolId,
          studentId: student.id,
          termId: request.termId,
          academicSessionId: request.academicSessionId,
          amountDue: 0,
          amountPaid: request.amountPaid,
          receiptImageUrl: request.receiptImageUrl,
          description: request.description || "",
          status: "Pending",
        },
      });
    }

    return successResponse(this.mapToResponse(feeRecord, student), "Fee payment receipt uploaded successfully.");
  }

  static async getMyFeeStatus(schoolId: string, userId: string, termId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, schoolId },
    });

    if (!student) {
      return failResponse("Student profile not found.");
    }

    return this.getStudentFeeStatus(schoolId, student.id, termId);
  }

  static async generateFeeReceiptPdf(schoolId: string, paymentId: string): Promise<any> {
    const feePayment = await prisma.feePayment.findFirst({
      where: { id: paymentId, schoolId },
      include: {
        student: {
          include: { class: true }
        },
        term: {
          include: { academicSession: true }
        },
        school: true,
        clearedByUser: true,
      }
    });

    if (!feePayment) {
      return failResponse("Fee payment record not found.");
    }

    const school = feePayment.school;
    const student = feePayment.student;
    const term = feePayment.term;

    // Find school Bursar for fallback signature if clearedByUser signature is not available
    let bursarUser = feePayment.clearedByUser;
    if (!bursarUser || !bursarUser.signatureUrl) {
      const schoolBursar = await prisma.user.findFirst({
        where: { schoolId, role: "Bursar", isActive: true }
      });
      if (schoolBursar) {
        bursarUser = schoolBursar;
      }
    }

    const theme = (school.schoolTheme as any) || {};
    const primaryColor = theme.primaryColor || "#053d26";

    const paymentDateStr = feePayment.createdAt
      ? new Date(feePayment.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const clearedAtStr = feePayment.clearedAt
      ? new Date(feePayment.clearedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : null;

    const studentClassName = student.class ? `${student.class.name} ${student.arm || ""}`.trim() : "N/A";
    const paymentDesc = feePayment.description || `School Fees Payment for ${term.termNumber} Term`;

    const statusColor = feePayment.status === "Cleared" ? "#16a34a" : feePayment.status === "Rejected" ? "#dc2626" : "#d97706";

    const templateData = {
      themeColor: primaryColor,
      schoolName: school.name,
      schoolLogo: school.logoUrl || "",
      paymentDate: paymentDateStr,
      paymentRef: feePayment.id.substring(0, 8).toUpperCase(),
      studentName: student.fullName,
      studentProgram: studentClassName,
      paymentDescription: paymentDesc,
      amountDue: Number(feePayment.amountDue).toLocaleString("en-NG", { minimumFractionDigits: 2 }),
      amountPaid: Number(feePayment.amountPaid).toLocaleString("en-NG", { minimumFractionDigits: 2 }),
      clearanceStatus: feePayment.status,
      statusColor,
      clearedByName: feePayment.clearedByUser?.name || null,
      clearedAtDate: clearedAtStr,
      bursarName: bursarUser?.name || "Bursar",
      bursarSignatureUrl: bursarUser?.signatureUrl || "",
      currentYear: new Date().getFullYear(),
    };

    const pdfBuffer = await PdfGenerator.renderTemplateToPdf("payment_receipt", templateData, {
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
    });

    return successResponse(pdfBuffer, "Fee receipt PDF generated successfully.");
  }
}
