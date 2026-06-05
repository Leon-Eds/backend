import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

export function tenantMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Try to get schoolId from req.user
  if (req.user && req.user.schoolId) {
    req.schoolId = req.user.schoolId;
  }

  // If schoolId is not present, we check if it is required
  next();
}

export function requireSchoolId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.schoolId) {
    return res.status(400).json({
      success: false,
      message: "School context (SchoolId) is required for this operation.",
    });
  }
  next();
}
