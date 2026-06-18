import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AcademicSessionService } from "../services/session.service";

export class AcademicSessionController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await AcademicSessionService.getSessions(schoolId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await AcademicSessionService.createSession(schoolId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async setCurrentSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await AcademicSessionService.setCurrentSession(schoolId, id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await AcademicSessionService.createTerm(schoolId, id, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async setCurrentTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { termId } = req.params;
      const result = await AcademicSessionService.setCurrentTerm(schoolId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await AcademicSessionService.updateSession(schoolId, id, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await AcademicSessionService.deleteSession(schoolId, id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { termId } = req.params;
      const result = await AcademicSessionService.updateTerm(schoolId, termId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { termId } = req.params;
      const result = await AcademicSessionService.deleteTerm(schoolId, termId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
