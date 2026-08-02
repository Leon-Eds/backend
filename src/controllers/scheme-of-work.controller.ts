import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { SchemeOfWorkService } from "../services/scheme-of-work.service";

export class SchemeOfWorkController {
  static async createSchemeOfWork(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await SchemeOfWorkService.createSchemeOfWork(
        schoolId,
        userId,
        userRole,
        req.body
      );

      if (result.success) {
        return res.status(201).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateSchemeOfWork(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await SchemeOfWorkService.updateSchemeOfWork(
        schoolId,
        id,
        userId,
        userRole,
        req.body.topics
      );

      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchemeOfWork(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      const result = await SchemeOfWorkService.deleteSchemeOfWork(
        schoolId,
        id,
        userId,
        userRole
      );

      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSchemeForSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, subjectId, termId } = req.params;

      const result = await SchemeOfWorkService.getSchemeForSubject(
        schoolId,
        classId,
        subjectId,
        termId
      );

      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getClassSchemes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, termId } = req.params;

      const result = await SchemeOfWorkService.getClassSchemes(
        schoolId,
        classId,
        termId
      );

      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMySchemes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id!;
      const { termId } = req.params;

      const result = await SchemeOfWorkService.getMySchemes(
        schoolId,
        userId,
        termId
      );

      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
