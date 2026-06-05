import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { ReportCardService } from "../services/report-card.service";
import { FeeService } from "../services/fee.service";
import { prisma } from "../config/db";

export class ReportCardController {
  static async getReportCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, termId } = req.params;

      const result = await ReportCardService.generateReportCard(schoolId, studentId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async downloadReportCardPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, termId } = req.params;

      const result = await ReportCardService.generateReportCardPdf(schoolId, studentId, termId);
      if (!result.success || !result.data) {
        return res.status(400).json(result);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=report_card_${studentId}_${termId}.pdf`);
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  static async downloadMyReportCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const { termId } = req.params;

      const student = await prisma.student.findFirst({
        where: { userId, schoolId },
      });

      if (!student) {
        return res.status(400).json({ success: false, message: "Student profile not found." });
      }

      // Check fee clearance
      const isCleared = await FeeService.isStudentCleared(schoolId, student.id, termId);
      if (!isCleared) {
        return res.status(400).json({
          success: false,
          message: "Your fees have not been cleared for this term. Please contact the school administration.",
        });
      }

      const result = await ReportCardService.generateReportCardPdf(schoolId, student.id, termId);
      if (!result.success || !result.data) {
        return res.status(400).json(result);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=my_report_card_${termId}.pdf`);
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  }
}
