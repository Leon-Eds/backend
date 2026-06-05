"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkEnterScoresSchema = exports.bulkScoreEntrySchema = exports.enterScoreSchema = void 0;
const zod_1 = require("zod");
exports.enterScoreSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    subjectId: zod_1.z.string().uuid("Invalid subject ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    termId: zod_1.z.string().uuid("Invalid term ID"),
    academicSessionId: zod_1.z.string().uuid("Invalid academic session ID"),
    firstCA: zod_1.z.number().min(0).max(20),
    secondCA: zod_1.z.number().min(0).max(20),
    exam: zod_1.z.number().min(0).max(60),
    remark: zod_1.z.string().max(200).optional().default(""),
});
exports.bulkScoreEntrySchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    firstCA: zod_1.z.number().min(0).max(20),
    secondCA: zod_1.z.number().min(0).max(20),
    exam: zod_1.z.number().min(0).max(60),
    remark: zod_1.z.string().max(200).optional().default(""),
});
exports.bulkEnterScoresSchema = zod_1.z.object({
    subjectId: zod_1.z.string().uuid("Invalid subject ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    termId: zod_1.z.string().uuid("Invalid term ID"),
    academicSessionId: zod_1.z.string().uuid("Invalid academic session ID"),
    scores: zod_1.z.array(exports.bulkScoreEntrySchema),
});
