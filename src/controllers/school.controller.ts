import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { SchoolService } from "../services/school.service";
import { successResponse } from "../utils/response";

export class SchoolController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await SchoolService.getAllSchools(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (req.user?.role !== "SuperAdmin" && req.user?.schoolId !== id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const result = await SchoolService.getSchoolById(id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(404).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (req.user?.role !== "SuperAdmin" && req.user?.schoolId !== id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const result = await SchoolService.updateSchool(id, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { subscriptionPlan } = req.body;
      const result = await SchoolService.updateSchoolPlan(id, subscriptionPlan);
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
      const { id } = req.params;
      const isActive = req.query.isActive === "true";
      const result = await SchoolService.updateSchoolStatus(id, isActive);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getPlans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const plans = await SchoolService.getSubscriptionPlans();
      return res.status(200).json(successResponse(plans));
    } catch (error) {
      next(error);
    }
  }
}
