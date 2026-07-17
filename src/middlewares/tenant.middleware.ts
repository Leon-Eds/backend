import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

export function tenantMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Try to get schoolId from req.user
  if (req.user && req.user.schoolId) {
    req.schoolId = req.user.schoolId;
  }

  // Fallback to headers if not present on req.user
  if (!req.schoolId) {
    const headerSchoolId = (req.headers["school-id"] || req.headers["schoolid"] || req.headers["x-school-id"]) as string;
    if (headerSchoolId) {
      req.schoolId = headerSchoolId;
    }
  }

  next();
}

export function requireSchoolId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.schoolId) {
    const headerSchoolId = (req.headers["school-id"] || req.headers["schoolid"] || req.headers["x-school-id"]) as string;
    if (headerSchoolId) {
      req.schoolId = headerSchoolId;
    }
  }

  if (!req.schoolId) {
    return res.status(400).json({
      success: false,
      message: "School context (SchoolId) is required for this operation.",
    });
  }
  next();
}
