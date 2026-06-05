"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignSubjectsToClassSchema = exports.updateClassSchema = exports.createClassSchema = void 0;
const zod_1 = require("zod");
exports.createClassSchema = zod_1.z.object({
    name: zod_1.z.string().max(100).min(1, "Name is required"),
    arm: zod_1.z.string().max(10).optional().default(""),
    academicSessionId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateClassSchema = zod_1.z.object({
    name: zod_1.z.string().max(100).optional(),
    arm: zod_1.z.string().max(10).optional(),
});
exports.assignSubjectsToClassSchema = zod_1.z.object({
    subjectIds: zod_1.z.array(zod_1.z.string().uuid("Invalid subject ID")),
});
