import { Response, NextFunction } from "express";
import { AuthenticatedRequest, UserPayload } from "../types";
import { prisma } from "../config/db";
import { verifyJwtToken } from "../utils/jwt";

export async function resolveAuthenticatedUser(token: string): Promise<UserPayload> {
  const decoded = verifyJwtToken(token);
  const userId = decoded.nameid || decoded.sub;
  if (!userId || typeof userId !== "string") {
    throw new Error("Authentication token has no valid subject.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      schoolId: true,
      isVerified: true,
      isActive: true,
      school: { select: { isActive: true } },
    },
  });

  if (!user || !user.isActive || (user.role !== "SuperAdmin" && !user.school?.isActive)) {
    throw new Error("Account is inactive.");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId || undefined,
    isVerified: user.isVerified,
  };
}

export function authMiddleware(allowedRoles?: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const token = authHeader.split(" ")[1];
    try {
      const userPayload = await resolveAuthenticatedUser(token);

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
