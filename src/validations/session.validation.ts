import { z } from "zod";

const realDate = z.union([z.string(), z.date()]).refine((value) => {
  const date = value instanceof Date ? value : new Date(value);
  const valid = !Number.isNaN(date.getTime());
  if (!valid) return false;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return date.toISOString().slice(0, 10) === value;
  }
  return true;
}, "Date must be a real ISO date or date-time");

const orderedDateRange = <T extends z.ZodRawShape>(shape: T) => z.object(shape).refine((value: any) => {
  if (!value.startDate || !value.endDate) return true;
  return new Date(value.startDate).getTime() < new Date(value.endDate).getTime();
}, { message: "startDate must be earlier than endDate", path: ["endDate"] });

export const createSessionSchema = orderedDateRange({
  name: z.string().max(50).min(1, "Name is required"),
  startDate: realDate,
  endDate: realDate,
});

export const createTermSchema = orderedDateRange({
  termNumber: z.enum(["First", "Second", "Third"]),
  startDate: realDate,
  endDate: realDate,
});

export const updateSessionSchema = orderedDateRange({
  name: z.string().max(50).min(1).optional(),
  startDate: realDate.optional(),
  endDate: realDate.optional(),
});

export const updateTermSchema = orderedDateRange({
  termNumber: z.enum(["First", "Second", "Third"]).optional(),
  startDate: realDate.optional(),
  endDate: realDate.optional(),
});
