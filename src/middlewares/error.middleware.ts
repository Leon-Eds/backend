import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

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
  const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();
  const title = status === 401
    ? "Unauthorized"
    : status === 403
      ? "Forbidden"
      : status >= 500
        ? "An unexpected error occurred."
        : "Request failed.";
  const detail = status >= 500 ? "Internal Server Error" : (err.message || "Request failed.");

  if (status >= 500) {
    console.error("[ErrorMiddleware] Unhandled request error", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: err.stack,
    });
  }

  res.setHeader("Content-Type", "application/problem+json");
  res.setHeader("X-Request-Id", requestId);
  res.status(status).json({
    type: "about:blank",
    title,
    status,
    detail,
    requestId,
  });
}
