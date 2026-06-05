"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
exports.createSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().max(150).min(1, "Name is required"),
});
exports.updateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().max(150).min(1, "Name is required"),
});
