import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { TeacherService } from "../services/teacher.service";

export class TeacherController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await TeacherService.getTeachers(schoolId, req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await TeacherService.getTeacherById(schoolId, id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(404).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await TeacherService.createTeacher(schoolId, req.body);
      if (result.success) {
        return res.status(201).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await TeacherService.updateTeacher(schoolId, id, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const isActiveQuery = req.query.isActive;
      const isActive = isActiveQuery !== undefined ? isActiveQuery === "true" : undefined;
      const result = await TeacherService.updateTeacherStatus(schoolId, id, isActive);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async assign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await TeacherService.assignTeacher(schoolId, id, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async removeAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { assignmentId } = req.params;
      const result = await TeacherService.removeAssignment(schoolId, assignmentId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
