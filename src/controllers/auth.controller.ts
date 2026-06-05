import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async createSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.createSuperAdmin(req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerSchool(req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(401).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refreshToken(req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(401).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized context" });
      }
      const result = await AuthService.changePassword(userId, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
