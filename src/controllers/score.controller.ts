import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { ScoreService } from "../services/score.service";
import { prisma } from "../config/db";

export class ScoreController {
  private static async getTeacherId(userId: string): Promise<string | null> {
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });
    return teacher ? teacher.id : null;
  }

  static async enterScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const teacherId = await ScoreController.getTeacherId(userId);

      const result = await ScoreService.enterScore(schoolId, teacherId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async bulkEnterScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const teacherId = await ScoreController.getTeacherId(userId);

      const result = await ScoreService.bulkEnterScores(schoolId, teacherId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassScoreSheet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, subjectId, termId } = req.params;

      const result = await ScoreService.getClassScoreSheet(schoolId, classId, subjectId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, termId } = req.params;

      const result = await ScoreService.getStudentScores(schoolId, studentId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
