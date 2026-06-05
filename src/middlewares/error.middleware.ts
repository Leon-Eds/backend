import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  status?: number;
}

export function errorMiddleware(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const title = status === 401 ? "Unauthorized" : "An unexpected error occurred.";
  const detail = err.message || "Internal Server Error";

  res.setHeader("Content-Type", "application/problem+json");
  res.status(status).json({
    type: "about:blank",
    title,
    status,
    detail,
  });
}
