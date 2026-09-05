import { z } from "zod";

export const createGradingRuleSchema = z.object({
  grade: z.enum(["A", "B", "C", "D", "E", "F"]),
  minScore: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(0).max(100),
  remark: z.string().max(100).optional().default(""),
}).refine((rule) => rule.minScore <= rule.maxScore, {
  message: "minScore must be less than or equal to maxScore",
  path: ["maxScore"],
});

export const bulkCreateGradingRulesSchema = z.object({
  rules: z.array(createGradingRuleSchema).min(1).max(6),
}).superRefine(({ rules }, context) => {
  const grades = rules.map((rule) => rule.grade);
  if (new Set(grades).size !== grades.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["rules"], message: "Each grade may only appear once." });
  }

  const ordered = [...rules].sort((a, b) => a.minScore - b.minScore);
  if (ordered[0]?.minScore !== 0 || ordered[ordered.length - 1]?.maxScore !== 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["rules"], message: "Grading rules must cover scores from 0 through 100." });
  }
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].minScore !== ordered[index - 1].maxScore + 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["rules"], message: "Grading ranges must not overlap or contain gaps." });
      break;
    }
  }
});
