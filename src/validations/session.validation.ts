import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().max(50).min(1, "Name is required"),
  startDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const createTermSchema = z.object({
  termNumber: z.enum(["First", "Second", "Third"]),
  startDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
