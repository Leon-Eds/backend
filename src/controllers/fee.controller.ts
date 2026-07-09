import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { FeeService } from "../services/fee.service";
import { failResponse } from "../utils/response";
import { prisma } from "../config/db";


export class FeeController {
  static async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await FeeService.recordPayment(schoolId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async clearStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const { studentId, termId } = req.params;

      const result = await FeeService.clearStudent(schoolId, studentId, termId, userId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentFeeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, termId } = req.params;

      const result = await FeeService.getStudentFeeStatus(schoolId, studentId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassFeeOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;

      const result = await FeeService.getClassFeeOverview(schoolId, classId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async uploadReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await FeeService.uploadReceipt(schoolId, userId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMyFeeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const termId = req.query.termId as string;

      if (!termId) {
        return res.status(400).json(failResponse("Missing termId in query parameter."));
      }

      const result = await FeeService.getMyFeeStatus(schoolId, userId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async downloadReceiptPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { paymentId } = req.params;
      const userRole = req.user?.role;
      const userId = req.user?.id;

      // Fetch payment record first to check ownership if Student
      const feePayment = await prisma.feePayment.findFirst({
        where: { id: paymentId, schoolId },
        include: { student: true }
      });

      if (!feePayment) {
        return res.status(404).json(failResponse("Receipt not found."));
      }

      if (userRole === "Student" && feePayment.student.userId !== userId) {
        return res.status(403).json(failResponse("Access Denied: You cannot download other students' receipts."));
      }

      const result = await FeeService.generateFeeReceiptPdf(schoolId, paymentId);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=receipt-${paymentId}.pdf`);
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  }
}

