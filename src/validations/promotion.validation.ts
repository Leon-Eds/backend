import { z } from "zod";

export const promoteStudentsSchema = z.object({
  mappings: z.array(
    z.object({
      sourceClassId: z.string().uuid(),
      targetClassId: z.string().uuid(),
    })
  ).min(1, "At least one class mapping is required."),
});

export const graduateClassSchema = z.object({
  classId: z.string().uuid(),
});
