import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AttendanceOfficerService } from "../services/attendance-officer.service";

export class AttendanceOfficerController {
  static async createOfficer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AttendanceOfficerService.createOfficer(req.schoolId!, req.body);
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getOfficers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AttendanceOfficerService.getOfficers(req.schoolId!);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteOfficer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AttendanceOfficerService.deleteOfficer(req.schoolId!, String(req.params.id));
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  }
}
