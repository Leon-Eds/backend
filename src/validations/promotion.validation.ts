import { z } from "zod";

export const promoteStudentsSchema = z.object({
  mappings: z.array(
    z.object({
      sourceClassId: z.string().uuid(),
      targetClassId: z.string().uuid(),
    })
  ).min(1, "At least one class mapping is required."),
}).superRefine(({ mappings }, context) => {
  const sourceIds = mappings.map((mapping) => mapping.sourceClassId);
  if (new Set(sourceIds).size !== sourceIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mappings"],
      message: "Each source class can only appear once.",
    });
  }
  mappings.forEach((mapping, index) => {
    if (mapping.sourceClassId === mapping.targetClassId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mappings", index, "targetClassId"],
        message: "Target class must be different from source class.",
      });
    }
  });
});

export const graduateClassSchema = z.object({
  classId: z.string().uuid(),
});
