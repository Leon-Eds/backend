"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const db_1 = require("../config/db");
const bcrypt_1 = require("../utils/bcrypt");
const response_1 = require("../utils/response");
class TeacherService {
    static getPlanLimits(plan) {
        switch (plan) {
            case "Plus":
                return 30;
            case "Premium":
                return 999999;
            case "Free":
            default:
                return 20;
        }
    }
    static mapToResponse(t) {
        return {
            id: t.id,
            userId: t.userId,
            fullName: t.fullName,
            email: t.email,
            phone: t.phone,
            isActive: t.isActive,
            createdAt: t.createdAt,
            assignments: t.subjectAssignments
                ? t.subjectAssignments.map((a) => ({
                    id: a.id,
                    subjectId: a.subjectId,
                    subjectName: a.subject?.name || "",
                    classId: a.classId,
                    className: a.class ? `${a.class.name} ${a.class.arm}`.trim() : "",
                }))
                : [],
        };
    }
    static async getTeachers(schoolId, params) {
        const pageNumber = parseInt(params.pageNumber || "1", 10);
        const pageSize = parseInt(params.pageSize || "20", 10);
        const search = params.search ? params.search.toLowerCase() : "";
        const where = { schoolId };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        const totalCount = await db_1.prisma.teacher.count({ where });
        const teachers = await db_1.prisma.teacher.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (pageNumber - 1) * pageSize,
            take: pageSize,
            include: {
                subjectAssignments: {
                    include: {
                        subject: true,
                        class: true,
                    },
                },
            },
        });
        const items = teachers.map((t) => this.mapToResponse(t));
        const pagedResult = (0, response_1.createPagedResult)(items, totalCount, pageNumber, pageSize);
        return (0, response_1.successResponse)(pagedResult);
    }
    static async getTeacherById(schoolId, teacherId) {
        const teacher = await db_1.prisma.teacher.findFirst({
            where: { id: teacherId, schoolId },
            include: {
                subjectAssignments: {
                    include: {
                        subject: true,
                        class: true,
                    },
                },
            },
        });
        if (!teacher) {
            return (0, response_1.failResponse)("Teacher not found.");
        }
        return (0, response_1.successResponse)(this.mapToResponse(teacher));
    }
    static async createTeacher(schoolId, request) {
        const school = await db_1.prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                teachers: { select: { isActive: true } },
            },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        const activeCount = school.teachers.filter((t) => t.isActive).length;
        const maxTeachers = this.getPlanLimits(school.subscriptionPlan);
        if (activeCount >= maxTeachers) {
            return (0, response_1.failResponse)(`Teacher limit reached. Your ${school.subscriptionPlan} plan allows max ${maxTeachers} teachers. Upgrade your plan.`);
        }
        const emailInUse = await db_1.prisma.user.findUnique({
            where: { email: request.email.toLowerCase() },
        });
        if (emailInUse) {
            return (0, response_1.failResponse)("Email already in use.");
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(request.password);
        const user = await db_1.prisma.user.create({
            data: {
                schoolId,
                name: request.fullName,
                email: request.email.toLowerCase(),
                passwordHash: hashedPassword,
                role: "Teacher",
                isActive: true,
            },
        });
        const teacher = await db_1.prisma.teacher.create({
            data: {
                schoolId,
                userId: user.id,
                fullName: request.fullName,
                email: request.email.toLowerCase(),
                phone: request.phone || "",
                isActive: true,
            },
            include: {
                subjectAssignments: {
                    include: {
                        subject: true,
                        class: true,
                    },
                },
            },
        });
        return (0, response_1.successResponse)(this.mapToResponse(teacher), "Teacher created successfully.");
    }
    static async updateTeacher(schoolId, teacherId, request) {
        const teacher = await db_1.prisma.teacher.findFirst({
            where: { id: teacherId, schoolId },
            include: {
                subjectAssignments: {
                    include: {
                        subject: true,
                        class: true,
                    },
                },
            },
        });
        if (!teacher) {
            return (0, response_1.failResponse)("Teacher not found.");
        }
        const updatedTeacher = await db_1.prisma.teacher.update({
            where: { id: teacherId },
            data: {
                fullName: request.fullName !== undefined ? request.fullName : undefined,
                phone: request.phone !== undefined ? request.phone : undefined,
            },
            include: {
                subjectAssignments: {
                    include: {
                        subject: true,
                        class: true,
                    },
                },
            },
        });
        if (request.fullName !== undefined && teacher.userId) {
            await db_1.prisma.user.update({
                where: { id: teacher.userId },
                data: { name: request.fullName },
            });
        }
        return (0, response_1.successResponse)(this.mapToResponse(updatedTeacher), "Teacher updated successfully.");
    }
    static async updateTeacherStatus(schoolId, teacherId, isActive) {
        const teacher = await db_1.prisma.teacher.findFirst({
            where: { id: teacherId, schoolId },
        });
        if (!teacher) {
            return (0, response_1.failResponse)("Teacher not found.");
        }
        await db_1.prisma.teacher.update({
            where: { id: teacherId },
            data: { isActive },
        });
        if (teacher.userId) {
            await db_1.prisma.user.update({
                where: { id: teacher.userId },
                data: { isActive },
            });
        }
        const message = isActive ? "Teacher activated." : "Teacher deactivated.";
        return (0, response_1.successResponse)(true, message);
    }
    static async assignTeacher(schoolId, teacherId, request) {
        const teacher = await db_1.prisma.teacher.findFirst({
            where: { id: teacherId, schoolId },
        });
        if (!teacher) {
            return (0, response_1.failResponse)("Teacher not found.");
        }
        const subject = await db_1.prisma.subject.findFirst({
            where: { id: request.subjectId, schoolId },
        });
        if (!subject) {
            return (0, response_1.failResponse)("Subject not found.");
        }
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: request.classId, schoolId },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        const assignmentExists = await db_1.prisma.teacherSubjectAssignment.findFirst({
            where: {
                teacherId,
                subjectId: request.subjectId,
                classId: request.classId,
            },
        });
        if (assignmentExists) {
            return (0, response_1.failResponse)("This assignment already exists.");
        }
        const assignment = await db_1.prisma.teacherSubjectAssignment.create({
            data: {
                teacherId,
                subjectId: request.subjectId,
                classId: request.classId,
            },
        });
        return (0, response_1.successResponse)({
            id: assignment.id,
            subjectId: subject.id,
            subjectName: subject.name,
            classId: classEntity.id,
            className: `${classEntity.name} ${classEntity.arm}`.trim(),
        }, "Teacher assigned successfully.");
    }
    static async removeAssignment(schoolId, assignmentId) {
        const assignment = await db_1.prisma.teacherSubjectAssignment.findFirst({
            where: {
                id: assignmentId,
                teacher: { schoolId },
            },
        });
        if (!assignment) {
            return (0, response_1.failResponse)("Assignment not found.");
        }
        await db_1.prisma.teacherSubjectAssignment.delete({
            where: { id: assignmentId },
        });
        return (0, response_1.successResponse)(true, "Assignment removed.");
    }
}
exports.TeacherService = TeacherService;
