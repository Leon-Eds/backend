"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCardService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
const grading_service_1 = require("./grading.service");
class ReportCardService {
    static async generateReportCard(schoolId, studentId, termId) {
        const result = await db_1.prisma.result.findFirst({
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
            return (0, response_1.failResponse)("Result not found for this student and term.");
        }
        const school = await db_1.prisma.school.findUnique({
            where: { id: schoolId },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        const totalInClass = await db_1.prisma.result.count({
            where: { schoolId, classId: result.classId, termId },
        });
        const scores = await db_1.prisma.score.findMany({
            where: { schoolId, studentId, termId },
            include: { subject: true },
            orderBy: {
                subject: {
                    name: "asc",
                },
            },
        });
        const gradingRulesResult = await grading_service_1.GradingService.getGradingRules(schoolId);
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
            position: result.position,
            totalStudentsInClass: totalInClass,
            subjectCount: result.subjectCount,
            teacherComment: result.teacherComment,
            adminComment: result.adminComment,
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
            })),
            gradingKey: (gradingRulesResult.data || []).map((g) => ({
                grade: g.grade,
                minScore: g.minScore,
                maxScore: g.maxScore,
                remark: g.remark,
            })),
        };
        return (0, response_1.successResponse)(reportCard, "Report card generated.");
    }
    static async generateReportCardPdf(schoolId, studentId, termId) {
        const reportCardResult = await this.generateReportCard(schoolId, studentId, termId);
        if (!reportCardResult.success || !reportCardResult.data) {
            return (0, response_1.failResponse)(reportCardResult.message);
        }
        const data = reportCardResult.data;
        // Create a new PDF document
        const doc = new pdfkit_1.default({ size: "A4", margin: 30 });
        const buffers = [];
        const pdfPromise = new Promise((resolve, reject) => {
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
        doc.fillColor(darkBlue).fontSize(20).text(data.schoolName, { align: "center", bold: true });
        doc.fillColor(textGrey).fontSize(9).text(data.schoolAddress, { align: "center" });
        doc.text(`Email: {data.schoolEmail} | Phone: {data.schoolPhone}`.replace("{data.schoolEmail}", data.schoolEmail).replace("{data.schoolPhone}", data.schoolPhone), { align: "center" });
        // Draw thick horizontal line
        doc.moveTo(30, 90).lineTo(565, 90).lineWidth(2).strokeColor(darkBlue).stroke();
        // 2. Report Card Title
        doc.moveDown(1.5);
        doc.fillColor(darkBlue).fontSize(14).text("STUDENT REPORT CARD", { align: "center", bold: true });
        doc.moveDown(0.5);
        // 3. Student Details Box
        const boxStartY = 135;
        const boxHeight = 65;
        doc.rect(30, boxStartY, 535, boxHeight).lineWidth(1).strokeColor(lightGrey).stroke();
        // Left Column Info
        doc.fillColor(darkGrey).fontSize(9);
        doc.text("Name:", 40, boxStartY + 10, { bold: true }).text(data.studentName, 120, boxStartY + 10);
        doc.text("Class:", 40, boxStartY + 28, { bold: true }).text(data.className, 120, boxStartY + 28);
        doc.text("Academic Session:", 40, boxStartY + 46, { bold: true }).text(data.academicSession, 130, boxStartY + 46);
        // Right Column Info
        doc.text("Admission No:", 300, boxStartY + 10, { bold: true }).text(data.admissionNumber, 380, boxStartY + 10);
        doc.text("Gender:", 300, boxStartY + 28, { bold: true }).text(data.gender, 380, boxStartY + 28);
        doc.text("Term:", 300, boxStartY + 46, { bold: true }).text(data.term, 380, boxStartY + 46);
        // 4. Scores Table
        const tableStartY = 215;
        const colWidths = {
            sn: 25,
            subject: 160,
            ca1: 50,
            ca2: 50,
            exam: 55,
            total: 60,
            grade: 50,
            remark: 85,
        };
        const colPositions = {
            sn: 30,
            subject: 30 + colWidths.sn,
            ca1: 30 + colWidths.sn + colWidths.subject,
            ca2: 30 + colWidths.sn + colWidths.subject + colWidths.ca1,
            exam: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2,
            total: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam,
            grade: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam + colWidths.total,
            remark: 30 + colWidths.sn + colWidths.subject + colWidths.ca1 + colWidths.ca2 + colWidths.exam + colWidths.total + colWidths.grade,
        };
        // Draw Table Header Background
        const headerHeight = 22;
        doc.rect(30, tableStartY, 535, headerHeight).fillColor(darkBlue).fill();
        // Table Header Text
        doc.fillColor("#ffffff").fontSize(8.5);
        doc.text("S/N", colPositions.sn + 3, tableStartY + 6, { width: colWidths.sn - 6, align: "left" });
        doc.text("Subject", colPositions.subject + 5, tableStartY + 6, { width: colWidths.subject - 10, align: "left" });
        doc.text("CA1 (20)", colPositions.ca1, tableStartY + 6, { width: colWidths.ca1, align: "center" });
        doc.text("CA2 (20)", colPositions.ca2, tableStartY + 6, { width: colWidths.ca2, align: "center" });
        doc.text("Exam (60)", colPositions.exam, tableStartY + 6, { width: colWidths.exam, align: "center" });
        doc.text("Total (100)", colPositions.total, tableStartY + 6, { width: colWidths.total, align: "center" });
        doc.text("Grade", colPositions.grade, tableStartY + 6, { width: colWidths.grade, align: "center" });
        doc.text("Remark", colPositions.remark + 5, tableStartY + 6, { width: colWidths.remark - 10, align: "left" });
        let currentY = tableStartY + headerHeight;
        const rowHeight = 20;
        // Draw Table Rows
        data.subjectScores.forEach((score, index) => {
            // Row Background
            if (index % 2 === 1) {
                doc.rect(30, currentY, 535, rowHeight).fillColor("#f9fafb").fill();
            }
            // Draw Row Bottom Border
            doc.moveTo(30, currentY + rowHeight).lineTo(565, currentY + rowHeight).lineWidth(0.5).strokeColor(lightGrey).stroke();
            // Row Text
            doc.fillColor(darkGrey).fontSize(8.5);
            doc.text((index + 1).toString(), colPositions.sn + 3, currentY + 5, { width: colWidths.sn - 6, align: "left" });
            doc.text(score.subjectName, colPositions.subject + 5, currentY + 5, { width: colWidths.subject - 10, align: "left" });
            doc.text(score.firstCA.toFixed(1), colPositions.ca1, currentY + 5, { width: colWidths.ca1, align: "center" });
            doc.text(score.secondCA.toFixed(1), colPositions.ca2, currentY + 5, { width: colWidths.ca2, align: "center" });
            doc.text(score.exam.toFixed(1), colPositions.exam, currentY + 5, { width: colWidths.exam, align: "center" });
            doc.text(score.total.toFixed(1), colPositions.total, currentY + 5, { width: colWidths.total, align: "center", bold: true });
            doc.text(score.grade, colPositions.grade, currentY + 5, { width: colWidths.grade, align: "center", bold: true });
            doc.text(score.remark, colPositions.remark + 5, currentY + 5, { width: colWidths.remark - 10, align: "left" });
            currentY += rowHeight;
        });
        // 5. Result Summary Box
        currentY += 12;
        doc.rect(30, currentY, 535, 45).fillColor(lightBlue).fill();
        doc.rect(30, currentY, 535, 45).lineWidth(1).strokeColor(borderBlue).stroke();
        doc.fillColor(darkBlue).fontSize(9);
        doc.text("Total Score:", 45, currentY + 10, { bold: true }).text(data.totalScore.toFixed(1), 120, currentY + 10);
        doc.text("Average:", 45, currentY + 26, { bold: true }).text(data.average.toFixed(2), 120, currentY + 26);
        const ordinalPos = this.getOrdinalSuffix(data.position);
        doc.text("Position:", 280, currentY + 10, { bold: true }).text(`${ordinalPos} out of ${data.totalStudentsInClass} students`, 350, currentY + 10);
        doc.text("Subjects:", 280, currentY + 26, { bold: true }).text(data.subjectCount.toString(), 350, currentY + 26);
        currentY += 45 + 12;
        // 6. Comments Box
        if (data.teacherComment || data.adminComment) {
            const commentsBoxHeight = (data.teacherComment ? 22 : 0) + (data.adminComment ? 22 : 0) + 10;
            doc.rect(30, currentY, 535, commentsBoxHeight).lineWidth(1).strokeColor(lightGrey).stroke();
            let commentOffset = currentY + 8;
            doc.fillColor(darkGrey).fontSize(8.5);
            if (data.teacherComment) {
                doc.text("Teacher's Comment:", 40, commentOffset, { bold: true })
                    .text(`"${data.teacherComment}"`, 140, commentOffset, { width: 410, oblique: true });
                commentOffset += 20;
            }
            if (data.adminComment) {
                doc.text("Principal's Comment:", 40, commentOffset, { bold: true })
                    .text(`"${data.adminComment}"`, 140, commentOffset, { width: 410, oblique: true });
            }
            currentY += commentsBoxHeight + 12;
        }
        // 7. Grading Key
        if (data.gradingKey && data.gradingKey.length > 0) {
            doc.fillColor(darkBlue).fontSize(9).text("Grading Key", 30, currentY, { bold: true });
            currentY += 12;
            // Draw Grading Key Table Header
            const keyHeaderHeight = 15;
            const keyColWidths = { grade: 60, range: 100, remark: 100 };
            const keyColPositions = {
                grade: 30,
                range: 90,
                remark: 190,
            };
            doc.rect(30, currentY, 260, keyHeaderHeight).fillColor("#f3f4f6").fill();
            doc.fillColor(darkGrey).fontSize(7.5);
            doc.text("Grade", keyColPositions.grade + 5, currentY + 4, { bold: true });
            doc.text("Score Range", keyColPositions.range, currentY + 4, { bold: true });
            doc.text("Remark", keyColPositions.remark, currentY + 4, { bold: true });
            currentY += keyHeaderHeight;
            data.gradingKey.forEach((key) => {
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
        return (0, response_1.successResponse)(pdfBuffer, "Report card PDF generated.");
    }
    static getOrdinalSuffix(num) {
        if (num <= 0)
            return num.toString();
        const cent = num % 100;
        if (cent >= 11 && cent <= 13)
            return `${num}th`;
        switch (num % 10) {
            case 1: return `${num}st`;
            case 2: return `${num}nd`;
            case 3: return `${num}rd`;
            default: return `${num}th`;
        }
    }
}
exports.ReportCardService = ReportCardService;
