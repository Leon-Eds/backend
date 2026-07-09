import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import PDFDocument from "pdfkit";


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
      where: { id: termId },
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
        where: { id: termId },
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

  private static async fetchImageBuffer(url: string): Promise<Buffer | null> {
    if (!url || !url.startsWith("http")) return null;
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch (_) {}
    return null;
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
        clearedByUser: { select: { name: true } }
      }
    });

    if (!feePayment) {
      return failResponse("Fee payment record not found.");
    }

    const school = feePayment.school;
    const student = feePayment.student;
    const term = feePayment.term;
    const session = term.academicSession;

    const theme = (school.schoolTheme as any) || {};
    const primaryColor = theme.primaryColor || "#1e3a8a";
    const secondaryColor = theme.secondaryColor || "#1e293b";
    const accentColor = theme.accentColor || "#3b82f6";
    const borderGrey = "#cbd5e1";
    const textGrey = "#475569";

    // Setup A5 Portrait Card Size (Width: 297 pt x Height: 420 pt - approx A5 scale)
    const doc = new PDFDocument({ size: [297, 420], margin: 12 });
    const buffers: Buffer[] = [];
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
    });

    // Outer border
    doc.rect(6, 6, 285, 408).lineWidth(1).strokeColor(primaryColor).stroke();

    // Top Accent Bar
    doc.rect(7, 7, 283, 50).fill(primaryColor);

    // Fetch School Logo
    const logoBuffer = await this.fetchImageBuffer(school.logoUrl);
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 12, 10, { width: 32, height: 32 });
      } catch (_) {
        this.drawReceiptLogoPlaceholder(doc, 12, 10, 32);
      }
    } else {
      this.drawReceiptLogoPlaceholder(doc, 12, 10, 32);
    }

    // School Name Header
    doc.fillColor("#ffffff").fontSize(9).text(school.name.toUpperCase(), 48, 12, {
      width: 230,
      height: 20,
      bold: true,
      align: "left",
    } as any);

    doc.fillColor("#e2e8f0").fontSize(6).text(school.address || "LeonEd School Portal", 48, 30, {
      width: 230,
      align: "left",
    });

    // Receipt title
    doc.fillColor(primaryColor).fontSize(10).text("OFFICIAL PAYMENT RECEIPT", 12, 68, { bold: true } as any);
    doc.moveTo(12, 80).lineTo(285, 80).lineWidth(1).strokeColor(primaryColor).stroke();

    // Details Grid
    const detailsY = 88;
    doc.rect(12, detailsY, 273, 55).fillColor("#f8fafc").fill();
    doc.rect(12, detailsY, 273, 55).lineWidth(0.5).strokeColor(borderGrey).stroke();

    doc.fillColor(textGrey).fontSize(6.5);
    doc.text("Receipt ID:", 18, detailsY + 8, { bold: true } as any).text(feePayment.id, 75, detailsY + 8);
    doc.text("Date Issued:", 18, detailsY + 20, { bold: true } as any).text(new Date(feePayment.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), 75, detailsY + 20);
    
    // Status Badge
    const status = feePayment.status;
    const statusColor = status === "Cleared" ? "#16a34a" : status === "Rejected" ? "#dc2626" : "#eab308";
    doc.text("Status:", 18, detailsY + 32, { bold: true } as any);
    doc.rect(75, detailsY + 30, 48, 10).fill(statusColor);
    doc.fillColor("#ffffff").fontSize(5.5).text(status.toUpperCase(), 75, detailsY + 32, { width: 48, align: "center", bold: true } as any);

    // Student Info
    const studentY = 152;
    doc.fillColor(primaryColor).fontSize(8).text("STUDENT & ACADEMIC INFO", 12, studentY, { bold: true } as any);
    doc.rect(12, studentY + 10, 273, 50).lineWidth(0.5).strokeColor(borderGrey).stroke();

    doc.fillColor(textGrey).fontSize(6.5);
    doc.text("Student Name:", 18, studentY + 16, { bold: true } as any).text(student.fullName, 75, studentY + 16);
    doc.text("Admission No:", 18, studentY + 26, { bold: true } as any).text(student.admissionNumber, 75, studentY + 26);
    const className = student.class ? `${student.class.name} ${student.arm || ""}`.trim() : "N/A";
    doc.text("Class:", 18, studentY + 36, { bold: true } as any).text(className, 75, studentY + 36);

    doc.text("Term:", 180, studentY + 16, { bold: true } as any).text(term.termNumber, 215, studentY + 16);
    doc.text("Session:", 180, studentY + 26, { bold: true } as any).text(session.name, 215, studentY + 26);

    // Payment breakdown table
    const tableY = 212;
    doc.rect(12, tableY, 273, 14).fill(primaryColor);
    doc.fillColor("#ffffff").fontSize(6.5);
    doc.text("Payment Description", 18, tableY + 4, { bold: true } as any);
    doc.text("Amount (NGN)", 200, tableY + 4, { bold: true, align: "right", width: 80 } as any);

    const rowY = tableY + 14;
    doc.rect(12, rowY, 273, 22).fillColor("#f8fafc").fill();
    doc.moveTo(12, rowY + 22).lineTo(285, rowY + 22).lineWidth(0.5).strokeColor(borderGrey).stroke();
    
    doc.fillColor(secondaryColor).fontSize(7);
    const description = feePayment.description || `School Fees Payment for ${term.termNumber} Term`;
    doc.text(description, 18, rowY + 7, { width: 175 });
    doc.text(Number(feePayment.amountPaid).toLocaleString("en-NG", { minimumFractionDigits: 2 }), 200, rowY + 7, { align: "right", width: 80 });

    // Total box
    const totalY = rowY + 22;
    doc.rect(12, totalY, 273, 20).lineWidth(0.5).strokeColor(borderGrey).stroke();
    doc.fillColor(primaryColor).fontSize(7.5).text("Total Paid:", 135, totalY + 6, { bold: true } as any);
    doc.text(`NGN ${Number(feePayment.amountPaid).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 200, totalY + 6, { bold: true, align: "right", width: 80 } as any);

    // Signature Block
    const signY = 295;
    doc.moveTo(180, signY + 30).lineTo(270, signY + 30).lineWidth(0.5).strokeColor(textGrey).stroke();
    doc.fillColor(textGrey).fontSize(5.5).text("Authorized Signature", 180, signY + 33, { width: 90, align: "center" });

    // Verified by
    if (status === "Cleared") {
      doc.fillColor("#16a34a").fontSize(6.5).text(`Cleared By: ${feePayment.clearedByUser?.name || "Bursar"}`, 15, signY + 10, { bold: true } as any);
      if (feePayment.clearedAt) {
        doc.text(`Date: ${new Date(feePayment.clearedAt).toLocaleDateString("en-GB")}`, 15, signY + 20);
      }
    }

    // Footnote
    doc.fillColor(textGrey).fontSize(6).text("Thank you for your payment. This is a secure system generated receipt.", 12, 395, {
      width: 273,
      align: "center",
      oblique: true,
    } as any);

    doc.end();

    const pdfBuffer = await pdfPromise;
    return successResponse(pdfBuffer, "Fee receipt PDF generated.");
  }

  private static drawReceiptLogoPlaceholder(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
    doc.rect(x, y, size, size).fill("#ffffff");
    doc.fillColor("#94a3b8").fontSize(6).text("LOGO", x, y + 13, { width: size, align: "center" });
  }
}
