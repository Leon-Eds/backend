import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { GradingService } from "../services/grading.service";

export class GradingController {
  static async setGradingRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await GradingService.setGradingRules(schoolId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getGradingRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await GradingService.getGradingRules(schoolId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
