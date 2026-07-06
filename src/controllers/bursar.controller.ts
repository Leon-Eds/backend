import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { BursarService } from "../services/bursar.service";

export class BursarController {
  static async createBursar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await BursarService.createBursar(schoolId, req.body);
      if (result.success) {
        return res.status(201).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentFeeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId } = req.params;
      const termId = req.query.termId as string;
      if (!termId) {
        return res.status(400).json({ success: false, message: "termId query parameter is required." });
      }
      const result = await BursarService.getStudentFeeStatus(schoolId, studentId, termId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassFeeOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.params;
      const termId = req.query.termId as string;
      if (!termId) {
        return res.status(400).json({ success: false, message: "termId query parameter is required." });
      }
      const result = await BursarService.getClassFeeOverview(schoolId, classId, termId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await BursarService.recordPayment(schoolId, req.body);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async clearStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId } = req.params;
      const termId = req.query.termId as string;
      if (!termId) {
        return res.status(400).json({ success: false, message: "termId query parameter is required." });
      }
      const result = await BursarService.clearStudent(schoolId, studentId, termId, req.user!.id);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSchoolFeeReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const termId = req.query.termId as string;
      if (!termId) {
        return res.status(400).json({ success: false, message: "termId query parameter is required." });
      }
      const result = await BursarService.getSchoolFeeReport(schoolId, termId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
