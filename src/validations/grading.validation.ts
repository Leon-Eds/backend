import { z } from "zod";

export const createGradingRuleSchema = z.object({
  grade: z.enum(["A", "B", "C", "D", "E", "F"]),
  minScore: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(0).max(100),
  remark: z.string().max(100).optional().default(""),
});

export const bulkCreateGradingRulesSchema = z.object({
  rules: z.array(createGradingRuleSchema),
});
