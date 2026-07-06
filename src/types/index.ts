import { Request } from "express";

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: "SuperAdmin" | "SchoolAdmin" | "Teacher" | "Student" | "Bursar";
  schoolId?: string;
  isVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  schoolId?: string;
}

// Extend global express Request namespace
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      schoolId?: string;
    }
  }
}
