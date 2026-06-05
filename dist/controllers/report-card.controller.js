"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCardController = void 0;
const report_card_service_1 = require("../services/report-card.service");
const fee_service_1 = require("../services/fee.service");
const db_1 = require("../config/db");
class ReportCardController {
    static async getReportCard(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, termId } = req.params;
            const result = await report_card_service_1.ReportCardService.generateReportCard(schoolId, studentId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async downloadReportCardPdf(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, termId } = req.params;
            const result = await report_card_service_1.ReportCardService.generateReportCardPdf(schoolId, studentId, termId);
            if (!result.success || !result.data) {
                return res.status(400).json(result);
            }
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=report_card_${studentId}_${termId}.pdf`);
            return res.send(result.data);
        }
        catch (error) {
            next(error);
        }
    }
    static async downloadMyReportCard(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const { termId } = req.params;
            const student = await db_1.prisma.student.findFirst({
                where: { userId, schoolId },
            });
            if (!student) {
                return res.status(400).json({ success: false, message: "Student profile not found." });
            }
            // Check fee clearance
            const isCleared = await fee_service_1.FeeService.isStudentCleared(schoolId, student.id, termId);
            if (!isCleared) {
                return res.status(400).json({
                    success: false,
                    message: "Your fees have not been cleared for this term. Please contact the school administration.",
                });
            }
            const result = await report_card_service_1.ReportCardService.generateReportCardPdf(schoolId, student.id, termId);
            if (!result.success || !result.data) {
                return res.status(400).json(result);
            }
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=my_report_card_${termId}.pdf`);
            return res.send(result.data);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportCardController = ReportCardController;
