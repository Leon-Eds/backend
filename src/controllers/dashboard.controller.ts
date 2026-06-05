import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  static async getSchoolDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await DashboardService.getSchoolDashboard(schoolId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSuperAdminDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await DashboardService.getSuperAdminDashboard();
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await DashboardService.getTeacherDashboard(schoolId, userId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await DashboardService.getStudentDashboard(schoolId, userId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
