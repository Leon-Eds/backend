"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateGradingRulesSchema = exports.createGradingRuleSchema = void 0;
const zod_1 = require("zod");
exports.createGradingRuleSchema = zod_1.z.object({
    grade: zod_1.z.enum(["A", "B", "C", "D", "E", "F"]),
    minScore: zod_1.z.number().int().min(0).max(100),
    maxScore: zod_1.z.number().int().min(0).max(100),
    remark: zod_1.z.string().max(100).optional().default(""),
});
exports.bulkCreateGradingRulesSchema = zod_1.z.object({
    rules: zod_1.z.array(exports.createGradingRuleSchema),
});
