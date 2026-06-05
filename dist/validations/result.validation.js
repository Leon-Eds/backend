"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveResultSchema = exports.submitResultSchema = void 0;
const zod_1 = require("zod");
exports.submitResultSchema = zod_1.z.object({
    teacherComment: zod_1.z.string().max(500).optional().default(""),
});
exports.approveResultSchema = zod_1.z.object({
    approve: zod_1.z.boolean().default(true),
    adminComment: zod_1.z.string().max(500).optional().default(""),
});
