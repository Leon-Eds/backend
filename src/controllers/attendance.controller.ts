import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AttendanceService } from "../services/attendance.service";

export class AttendanceController {

  static async getMyFormClasses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await AttendanceService.getMyFormClasses(schoolId, userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassAttendanceSheet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.params;
      const dateStr = (req.query.date as string) || new Date().toISOString().split("T")[0];

      const result = await AttendanceService.getClassAttendanceSheet(schoolId, classId, dateStr);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async recordClassAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.params;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await AttendanceService.recordClassAttendance(
        schoolId,
        classId,
        userId,
        userRole,
        req.body
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassAttendanceStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.params;
      
      const today = new Date().toISOString().split("T")[0];
      const startDateStr = (req.query.startDate as string) || today;
      const endDateStr = (req.query.endDate as string) || today;

      const result = await AttendanceService.getClassAttendanceStats(
        schoolId,
        classId,
        startDateStr,
        endDateStr
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
