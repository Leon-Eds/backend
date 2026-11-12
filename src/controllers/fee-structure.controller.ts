import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { FeeStructureService } from "../services/fee-structure.service";

export class FeeStructureController {
  static async getStructures(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.getStructures(req.schoolId!);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.createStructure(req.schoolId!, req.body);
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.updateStructure(req.schoolId!, String(req.params.id), req.body);
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.deleteStructure(req.schoolId!, String(req.params.id));
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentCustomFees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.getStudentCustomFees(req.schoolId!);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async setStudentCustomFees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.setStudentCustomFees(
        req.schoolId!,
        String(req.params.studentId),
        req.body.feeStructureIds
      );
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMyFees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FeeStructureService.getMyFees(req.schoolId!, req.user!.id);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTermSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const termId = req.query.termId ? String(req.query.termId) : undefined;
      const result = await FeeStructureService.getTermSummary(req.schoolId!, termId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
