import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, UserPayload } from "../types";

export function authMiddleware(allowedRoles?: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_KEY || "SuperSecretDefaultKeyForLeonEdBackendNodeJSNodeJSNodeJSNodeJSNodeJSNodeJS";

    try {
      const decoded = jwt.verify(token, secret) as any;
      
      // Map token claims to req.user
      // C# claims: NameIdentifier -> id, Email -> email, Name -> name, Role -> role, SchoolId -> schoolId
      const userPayload: UserPayload = {
        id: decoded.nameid || decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.unique_name || decoded.name,
        role: decoded.role,
        schoolId: decoded.SchoolId || decoded.schoolId,
        isVerified: decoded.isVerified ?? false,
      };

      req.user = userPayload;

      // Extract school context if present
      if (userPayload.schoolId) {
        req.schoolId = userPayload.schoolId;
      }

      // Check if user has verified email
      if (!userPayload.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification is required. Please verify your email using the OTP sent.",
          requiresVerification: true,
        });
      }

      // Check roles if specified
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(userPayload.role)) {
          return res.status(403).json({
            success: false,
            message: "You do not have permission to access this resource.",
          });
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }
  };
}
