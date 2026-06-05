"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class ClassService {
    static mapToResponse(c) {
        return {
            id: c.id,
            name: c.name,
            arm: c.arm,
            studentCount: c.students ? c.students.length : 0,
            academicSessionId: c.academicSessionId,
            academicSessionName: c.academicSession?.name || null,
            subjects: c.classSubjects
                ? c.classSubjects.map((cs) => ({
                    subjectId: cs.subjectId,
                    subjectName: cs.subject?.name || "",
                }))
                : [],
            createdAt: c.createdAt,
        };
    }
    static async getClasses(schoolId) {
        const classes = await db_1.prisma.class.findMany({
            where: { schoolId },
            include: {
                students: true,
                classSubjects: {
                    include: {
                        subject: true,
                    },
                },
                academicSession: true,
            },
            orderBy: { name: "asc" },
        });
        const items = classes.map((c) => this.mapToResponse(c));
        return (0, response_1.successResponse)(items);
    }
    static async getClassById(schoolId, classId) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
            include: {
                students: true,
                classSubjects: {
                    include: {
                        subject: true,
                    },
                },
                academicSession: true,
            },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        return (0, response_1.successResponse)(this.mapToResponse(classEntity));
    }
    static async createClass(schoolId, request) {
        const classEntity = await db_1.prisma.class.create({
            data: {
                schoolId,
                name: request.name,
                arm: request.arm || "",
                academicSessionId: request.academicSessionId || null,
            },
            include: {
                students: true,
                classSubjects: {
                    include: {
                        subject: true,
                    },
                },
                academicSession: true,
            },
        });
        return (0, response_1.successResponse)(this.mapToResponse(classEntity), "Class created successfully.");
    }
    static async updateClass(schoolId, classId, request) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        const updated = await db_1.prisma.class.update({
            where: { id: classId },
            data: {
                name: request.name !== undefined ? request.name : undefined,
                arm: request.arm !== undefined ? request.arm : undefined,
            },
            include: {
                students: true,
                classSubjects: {
                    include: {
                        subject: true,
                    },
                },
                academicSession: true,
            },
        });
        return (0, response_1.successResponse)(this.mapToResponse(updated), "Class updated successfully.");
    }
    static async deleteClass(schoolId, classId) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
            include: {
                students: true,
            },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        if (classEntity.students.length > 0) {
            return (0, response_1.failResponse)("Cannot delete a class with students. Reassign them first.");
        }
        await db_1.prisma.class.delete({
            where: { id: classId },
        });
        return (0, response_1.successResponse)(true, "Class deleted successfully.");
    }
    static async assignSubjectsToClass(schoolId, classId, request) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        const subjectIds = request.subjectIds || [];
        // Verify all subjectIds exist in this school
        for (const subjectId of subjectIds) {
            const subjectExists = await db_1.prisma.subject.findFirst({
                where: { id: subjectId, schoolId },
            });
            if (!subjectExists) {
                return (0, response_1.failResponse)(`Subject ${subjectId} not found in this school.`);
            }
        }
        // Delete existing class subjects, then recreate them in transaction
        await db_1.prisma.$transaction([
            db_1.prisma.classSubject.deleteMany({
                where: { classId },
            }),
            db_1.prisma.classSubject.createMany({
                data: Array.from(new Set(subjectIds)).map((subjId) => ({
                    classId,
                    subjectId: subjId,
                })),
            }),
        ]);
        const updated = await db_1.prisma.class.findFirst({
            where: { id: classId },
            include: {
                students: true,
                classSubjects: {
                    include: {
                        subject: true,
                    },
                },
                academicSession: true,
            },
        });
        return (0, response_1.successResponse)(this.mapToResponse(updated), "Subjects assigned to class successfully.");
    }
}
exports.ClassService = ClassService;
