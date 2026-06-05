import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { failResponse } from "../utils/response";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json(failResponse("Validation failed", errors));
      }
      next(error);
    }
  };
}
