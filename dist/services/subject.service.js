"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class SubjectService {
    static async getSubjects(schoolId) {
        const subjects = await db_1.prisma.subject.findMany({
            where: { schoolId },
            include: {
                classSubjects: true,
            },
            orderBy: { name: "asc" },
        });
        const items = subjects.map((s) => ({
            id: s.id,
            name: s.name,
            classCount: s.classSubjects ? s.classSubjects.length : 0,
            createdAt: s.createdAt,
        }));
        return (0, response_1.successResponse)(items);
    }
    static async createSubject(schoolId, request) {
        const existing = await db_1.prisma.subject.findFirst({
            where: {
                schoolId,
                name: { equals: request.name, mode: "insensitive" },
            },
        });
        if (existing) {
            return (0, response_1.failResponse)("Subject already exists in this school.");
        }
        const subject = await db_1.prisma.subject.create({
            data: {
                schoolId,
                name: request.name,
            },
        });
        return (0, response_1.successResponse)({
            id: subject.id,
            name: subject.name,
            classCount: 0,
            createdAt: subject.createdAt,
        }, "Subject created successfully.");
    }
    static async updateSubject(schoolId, subjectId, request) {
        const subject = await db_1.prisma.subject.findFirst({
            where: { id: subjectId, schoolId },
            include: { classSubjects: true },
        });
        if (!subject) {
            return (0, response_1.failResponse)("Subject not found.");
        }
        const existingName = await db_1.prisma.subject.findFirst({
            where: {
                schoolId,
                id: { not: subjectId },
                name: { equals: request.name, mode: "insensitive" },
            },
        });
        if (existingName) {
            return (0, response_1.failResponse)("Another subject with this name already exists.");
        }
        const updated = await db_1.prisma.subject.update({
            where: { id: subjectId },
            data: { name: request.name },
        });
        return (0, response_1.successResponse)({
            id: updated.id,
            name: updated.name,
            classCount: subject.classSubjects ? subject.classSubjects.length : 0,
            createdAt: updated.createdAt,
        }, "Subject updated successfully.");
    }
    static async deleteSubject(schoolId, subjectId) {
        const subject = await db_1.prisma.subject.findFirst({
            where: { id: subjectId, schoolId },
        });
        if (!subject) {
            return (0, response_1.failResponse)("Subject not found.");
        }
        await db_1.prisma.subject.delete({
            where: { id: subjectId },
        });
        return (0, response_1.successResponse)(true, "Subject deleted successfully.");
    }
}
exports.SubjectService = SubjectService;
