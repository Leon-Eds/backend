import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { PromotionService } from "../services/promotion.service";

export class PromotionController {
  static async promote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await PromotionService.promoteStudents(schoolId, req.body.mappings);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async graduate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.body;
      const result = await PromotionService.graduateClass(schoolId, classId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async markLeft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId } = req.params;
      const result = await PromotionService.markStudentLeft(schoolId, studentId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
