import PDFDocument from "pdfkit";
import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { GradingService } from "./grading.service";

export class ReportCardService {
  static async generateReportCard(schoolId: string, studentId: string, termId: string) {
    const result = await prisma.result.findFirst({
      where: { schoolId, studentId, termId },
      include: {
        student: true,
        class: true,
        term: {
          include: { academicSession: true },
        },
      },
    });

    if (!result) {
      return failResponse("Result not found for this student and term.");
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const totalInClass = await prisma.result.count({
      where: { schoolId, classId: result.classId, termId },
    });

    const scores = await prisma.score.findMany({
      where: { schoolId, studentId, termId },
      include: { subject: true },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    const gradingRulesResult = await GradingService.getGradingRules(schoolId);

    const reportCard = {
      schoolName: school.name,
      schoolAddress: school.address,
      schoolEmail: school.contactEmail,
      schoolPhone: school.contactPhone,
      schoolLogoUrl: school.logoUrl,
      studentName: result.student.fullName,
      admissionNumber: result.student.admissionNumber,
      className: result.class ? `${result.class.name} ${result.class.arm}`.trim() : "",
      gender: result.student.gender,
      academicSession: result.term.academicSession.name,
      term: result.term.termNumber,
      totalScore: Number(result.totalScore),
      average: Number(result.average),
      classAverage: Number(result.classAverage),
      position: result.position,
      totalStudentsInClass: totalInClass,
      subjectCount: result.subjectCount,
      teacherComment: result.teacherComment,
      adminComment: result.adminComment,
      studentPictureUrl: result.student.profilePictureUrl || "",
      subjectScores: scores.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        studentName: result.student.fullName,
        admissionNumber: result.student.admissionNumber,
        subjectId: s.subjectId,
        subjectName: s.subject.name,
        firstCA: Number(s.firstCA),
        secondCA: Number(s.secondCA),
        exam: Number(s.exam),
        total: Number(s.total),
        grade: s.grade,
        remark: s.remark,
        subjectPosition: s.subjectPosition || 0,
      })),
      gradingKey: (gradingRulesResult.data || []).map((g: any) => ({
        grade: g.grade,
        minScore: g.minScore,
        maxScore: g.maxScore,
        remark: g.remark,
      })),
    };

    return successResponse(reportCard, "Report card generated.");
  }

  static async generateReportCardPdf(schoolId: string, studentId: string, termId: string): Promise<any> {
    const reportCardResult = await this.generateReportCard(schoolId, studentId, termId);
    if (!reportCardResult.success || !reportCardResult.data) {
      return failResponse(reportCardResult.message);
    }

    const data = reportCardResult.data;

    // Create a new PDF document
    const doc = new PDFDocument({ size: "A4", margin: 30 });

    const buffers: Buffer[] = [];
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
    });

    // Color palette
    const darkBlue = "#1e3a8a";
    const lightBlue = "#eff6ff";
    const borderBlue = "#3b82f6";
    const darkGrey = "#374151";
    const lightGrey = "#e5e7eb";
    const textGrey = "#6b7280";

    // 1. Header Section
    // Draw left-aligned school header with a space on the right for logo
    doc.fillColor(darkBlue).fontSize(20).text(data.schoolName, 30, 40, { width: 420, bold: true } as any);
    doc.fillColor(textGrey).fontSize(9).text(data.schoolAddress, 30, 65, { width: 420 });
    doc.text(`Email: ${data.schoolEmail} | Phone: ${data.schoolPhone}`, 30, 80, { width: 420 });

    // Draw School Logo / Placeholder
    const logoX = 485;
    const logoY = 35;
    const logoSize = 65;
    
    // Draw aesthetic placeholder frame
    doc.rect(logoX, logoY, logoSize, logoSize).lineWidth(1.5).strokeColor(darkBlue).stroke();
    doc.fillColor(lightBlue).rect(logoX + 1, logoY + 1, logoSize - 2, logoSize - 2).fill();
    doc.fillColor(darkBlue).fontSize(10).text("LOGO", logoX, logoY + 26, { width: logoSize, align: "center", bold: true } as any);

    // Draw thick horizontal line
    doc.moveTo(30, 115).lineTo(565, 115).lineWidth(2).strokeColor(darkBlue).stroke();

    // 2. Report Card Title
    doc.moveDown(1.5);
    doc.fillColor(darkBlue).fontSize(14).text("STUDENT REPORT CARD", 30, 125, { align: "center", bold: true } as any);

    // 3. Student Details Box with Photo on the left, details on right
    const boxStartY = 150;
    const boxHeight = 80;
    doc.rect(30, boxStartY, 535, boxHeight).lineWidth(1).strokeColor(lightGrey).stroke();

    // Student photo frame
    const photoX = 40;
    const photoY = boxStartY + 10;
    const photoWidth = 60;
    const photoHeight = 60;
    doc.rect(photoX, photoY, photoWidth, photoHeight).lineWidth(1).strokeColor(lightGrey).stroke();
    doc.fillColor("#f3f4f6").rect(photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2).fill();
    doc.fillColor(textGrey).fontSize(8).text("PHOTO", photoX, photoY + 26, { width: photoWidth, align: "center" });

    // Left Column Info (shifted to accommodate photo)
    doc.fillColor(darkGrey).fontSize(9);
    doc.text("Name:", 120, boxStartY + 15, { bold: true } as any).text(data.studentName, 175, boxStartY + 15);
    doc.text("Class:", 120, boxStartY + 33, { bold: true } as any).text(data.className, 175, boxStartY + 33);
    doc.text("Session:", 120, boxStartY + 51, { bold: true } as any).text(data.academicSession, 175, boxStartY + 51);

    // Right Column Info
    doc.text("Admission No:", 340, boxStartY + 15, { bold: true } as any).text(data.admissionNumber, 430, boxStartY + 15);
    doc.text("Gender:", 340, boxStartY + 33, { bold: true } as any).text(data.gender, 430, boxStartY + 33);
    doc.text("Term:", 340, boxStartY + 51, { bold: true } as any).text(data.term, 430, boxStartY + 51);

    // 4. Scores Table
    const tableStartY = 245;
    const colWidths = {
      sn: 25,
      subject: 150,
      ca1: 45,
      ca2: 45,
      exam: 50,
      total: 55,
      grade: 45,
      position: 60,
      remark: 60,
    };

    const colPositions = {
      sn: 30,
      subject: 30 + colWidths.sn,
      ca1: 30 + colWidths.sn + colWidths.subject,
      ca2: 30 + colWidths.sn + colWidths.subject + colWidths.ca1,
      exam: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2,
      total: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam,
      grade: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam + colWidths.total,
      position: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam + colWidths.total + colWidths.grade,
      remark: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam + colWidths.total + colWidths.grade + colWidths.position,
    };

    // Draw Table Header Background
    const headerHeight = 22;
    doc.rect(30, tableStartY, 535, headerHeight).fillColor(darkBlue).fill();

    // Table Header Text
    doc.fillColor("#ffffff").fontSize(8);
    doc.text("S/N", colPositions.sn + 2, tableStartY + 6, { width: colWidths.sn - 4, align: "left" });
    doc.text("Subject", colPositions.subject + 5, tableStartY + 6, { width: colWidths.subject - 10, align: "left" });
    doc.text("CA1 (20)", colPositions.ca1, tableStartY + 6, { width: colWidths.ca1, align: "center" });
    doc.text("CA2 (20)", colPositions.ca2, tableStartY + 6, { width: colWidths.ca2, align: "center" });
    doc.text("Exam (60)", colPositions.exam, tableStartY + 6, { width: colWidths.exam, align: "center" });
    doc.text("Total (100)", colPositions.total, tableStartY + 6, { width: colWidths.total, align: "center" });
    doc.text("Grade", colPositions.grade, tableStartY + 6, { width: colWidths.grade, align: "center" });
    doc.text("Position", colPositions.position, tableStartY + 6, { width: colWidths.position, align: "center" });
    doc.text("Remark", colPositions.remark + 2, tableStartY + 6, { width: colWidths.remark - 4, align: "left" });

    let currentY = tableStartY + headerHeight;
    const rowHeight = 20;

    // Draw Table Rows
    data.subjectScores.forEach((score: any, index: number) => {
      // Row Background
      if (index % 2 === 1) {
        doc.rect(30, currentY, 535, rowHeight).fillColor("#f9fafb").fill();
      }

      // Draw Row Bottom Border
      doc.moveTo(30, currentY + rowHeight).lineTo(565, currentY + rowHeight).lineWidth(0.5).strokeColor(lightGrey).stroke();

      // Row Text
      doc.fillColor(darkGrey).fontSize(8);
      doc.text((index + 1).toString(), colPositions.sn + 2, currentY + 5, { width: colWidths.sn - 4, align: "left" });
      doc.text(score.subjectName, colPositions.subject + 5, currentY + 5, { width: colWidths.subject - 10, align: "left" });
      doc.text(score.firstCA.toFixed(1), colPositions.ca1, currentY + 5, { width: colWidths.ca1, align: "center" });
      doc.text(score.secondCA.toFixed(1), colPositions.ca2, currentY + 5, { width: colWidths.ca2, align: "center" });
      doc.text(score.exam.toFixed(1), colPositions.exam, currentY + 5, { width: colWidths.exam, align: "center" });
      doc.text(score.total.toFixed(1), colPositions.total, currentY + 5, { width: colWidths.total, align: "center", bold: true } as any);
      doc.text(score.grade, colPositions.grade, currentY + 5, { width: colWidths.grade, align: "center", bold: true } as any);
      doc.text(this.getOrdinalSuffix(score.subjectPosition), colPositions.position, currentY + 5, { width: colWidths.position, align: "center" });
      doc.text(score.remark, colPositions.remark + 2, currentY + 5, { width: colWidths.remark - 4, align: "left" });

      currentY += rowHeight;
    });

    // 5. Result Summary Box (Updated: includes student average, class average, class position)
    currentY += 12;
    doc.rect(30, currentY, 535, 45).fillColor(lightBlue).fill();
    doc.rect(30, currentY, 535, 45).lineWidth(1).strokeColor(borderBlue).stroke();

    doc.fillColor(darkBlue).fontSize(9);
    doc.text("Total Score:", 45, currentY + 10, { bold: true } as any).text(data.totalScore.toFixed(1), 120, currentY + 10);
    doc.text("Average:", 45, currentY + 26, { bold: true } as any).text(`${data.average.toFixed(2)}%`, 120, currentY + 26);

    const ordinalPos = this.getOrdinalSuffix(data.position);
    doc.text("Class Position:", 230, currentY + 10, { bold: true } as any).text(`${ordinalPos} of ${data.totalStudentsInClass}`, 310, currentY + 10);
    doc.text("Class Average:", 230, currentY + 26, { bold: true } as any).text(`${data.classAverage.toFixed(2)}%`, 310, currentY + 26);

    doc.text("Subjects:", 440, currentY + 10, { bold: true } as any).text(data.subjectCount.toString(), 495, currentY + 10);

    currentY += 45 + 12;

    // 6. Comments Box
    if (data.teacherComment || data.adminComment) {
      const commentsBoxHeight = (data.teacherComment ? 22 : 0) + (data.adminComment ? 22 : 0) + 10;
      doc.rect(30, currentY, 535, commentsBoxHeight).lineWidth(1).strokeColor(lightGrey).stroke();

      let commentOffset = currentY + 8;
      doc.fillColor(darkGrey).fontSize(8.5);

      if (data.teacherComment) {
        doc.text("Teacher's Comment:", 40, commentOffset, { bold: true } as any)
           .text(`"${data.teacherComment}"`, 140, commentOffset, { width: 410, oblique: true } as any);
        commentOffset += 20;
      }

      if (data.adminComment) {
        doc.text("Principal's Comment:", 40, commentOffset, { bold: true } as any)
           .text(`"${data.adminComment}"`, 140, commentOffset, { width: 410, oblique: true } as any);
      }

      currentY += commentsBoxHeight + 12;
    }

    // 7. Grading Key
    if (data.gradingKey && data.gradingKey.length > 0) {
      doc.fillColor(darkBlue).fontSize(9).text("Grading Key", 30, currentY, { bold: true } as any);
      currentY += 12;

      // Draw Grading Key Table Header
      const keyHeaderHeight = 15;
      const keyColPositions = {
        grade: 30,
        range: 90,
        remark: 190,
      };

      doc.rect(30, currentY, 260, keyHeaderHeight).fillColor("#f3f4f6").fill();
      doc.fillColor(darkGrey).fontSize(7.5);
      doc.text("Grade", keyColPositions.grade + 5, currentY + 4, { bold: true } as any);
      doc.text("Score Range", keyColPositions.range, currentY + 4, { bold: true } as any);
      doc.text("Remark", keyColPositions.remark, currentY + 4, { bold: true } as any);

      currentY += keyHeaderHeight;

      data.gradingKey.forEach((key: any) => {
        doc.text(key.grade, keyColPositions.grade + 5, currentY + 3);
        doc.text(`${key.minScore} - ${key.maxScore}`, keyColPositions.range, currentY + 3);
        doc.text(key.remark, keyColPositions.remark, currentY + 3);
        currentY += 11;
      });
    }

    // 8. Footer Section
    doc.fillColor(textGrey).fontSize(8)
       .text("Generated by LeonEd Africa", 30, 800)
       .text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), 500, 800);

    // End Document writing and wait for completion
    doc.end();

    const pdfBuffer = await pdfPromise;
    return successResponse(pdfBuffer, "Report card PDF generated.");
  }

  private static getOrdinalSuffix(num: number): string {
    if (num <= 0) return num.toString();
    const cent = num % 100;
    if (cent >= 11 && cent <= 13) return `${num}th`;
    switch (num % 10) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  }
}
