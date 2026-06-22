import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { TeacherPortalService } from "../services/teacher-portal.service";

export class TeacherPortalController {
  static async getMyAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await TeacherPortalService.getMyAssignments(schoolId, userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMyClasses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await TeacherPortalService.getMyClasses(schoolId, userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMySubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const result = await TeacherPortalService.getMySubjects(schoolId, userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMyClassStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const { classId } = req.params;
      const result = await TeacherPortalService.getMyClassStudents(schoolId, userId, classId);
      return res.status(result.success ? 200 : 403).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getScoreProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const classId = String(req.query.classId || "");
      const subjectId = String(req.query.subjectId || "");
      const termId = String(req.query.termId || "");

      if (!classId || !subjectId || !termId) {
        return res.status(400).json({ success: false, message: "classId, subjectId, and termId are required." });
      }

      const result = await TeacherPortalService.getScoreProgress(schoolId, userId, classId, subjectId, termId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
