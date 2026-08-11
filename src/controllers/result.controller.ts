import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { ResultService } from "../services/result.service";

export class ResultController {
  static async computeClassResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await ResultService.computeClassResults(schoolId, classId, termId, userId, userRole);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await ResultService.submitResults(schoolId, classId, termId, userId, userRole, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async approveResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;

      const result = await ResultService.approveResults(schoolId, classId, termId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async publishResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;

      const result = await ResultService.publishResults(schoolId, classId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;

      const result = await ResultService.getClassResults(schoolId, classId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentResult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, termId } = req.params;

      const result = await ResultService.getStudentResult(schoolId, studentId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async checkMyResult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;

      const termId = req.params.termId || (req.query.termId as string);

      const result = await ResultService.checkMyResult(schoolId, userId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getPendingApprovalsCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await ResultService.getPendingApprovalsCount(schoolId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async toggleResultEditing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.params;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await ResultService.toggleResultEditing(schoolId, classId, userId, userRole);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getResultEditingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId } = req.params;

      const result = await ResultService.getResultEditingStatus(schoolId, classId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateResultMetadata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { resultId } = req.params;

      const result = await ResultService.updateResultMetadata(
        schoolId,
        resultId,
        req.body
      );

      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getApprovedClassResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;

      const result = await ResultService.getApprovedClassResults(schoolId, classId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getApprovedResultsByTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { termId } = req.params;
      const classId = req.query.classId as string | undefined;

      const result = await ResultService.getApprovedResultsByTerm(schoolId, termId, classId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}

