"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class DashboardService {
    static getMaxTeachers(plan) {
        switch (plan) {
            case "Free":
                return 20;
            case "Plus":
                return 30;
            case "Premium":
                return 999999; // Using 999999 to represent infinite/unlimited
            default:
                return 20;
        }
    }
    static getMaxStudents(plan) {
        switch (plan) {
            case "Free":
                return 100;
            case "Plus":
                return 200;
            case "Premium":
                return 999999;
            default:
                return 100;
        }
    }
    static async getSchoolDashboard(schoolId) {
        const school = await db_1.prisma.school.findUnique({
            where: { id: schoolId },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        const currentSession = await db_1.prisma.academicSession.findFirst({
            where: { schoolId, isCurrent: true },
        });
        const currentTerm = currentSession
            ? await db_1.prisma.term.findFirst({
                where: { academicSessionId: currentSession.id, isCurrent: true },
            })
            : null;
        const totalStudents = await db_1.prisma.student.count({
            where: { schoolId, status: "Active" },
        });
        const totalTeachers = await db_1.prisma.teacher.count({
            where: { schoolId, isActive: true },
        });
        const totalClasses = await db_1.prisma.class.count({
            where: { schoolId },
        });
        const totalSubjects = await db_1.prisma.subject.count({
            where: { schoolId },
        });
        return (0, response_1.successResponse)({
            schoolId: school.id,
            schoolName: school.name,
            subscriptionPlan: school.subscriptionPlan,
            totalStudents,
            totalTeachers,
            totalClasses,
            totalSubjects,
            maxStudents: this.getMaxStudents(school.subscriptionPlan),
            maxTeachers: this.getMaxTeachers(school.subscriptionPlan),
            currentSession: currentSession?.name || null,
            currentTerm: currentTerm?.termNumber || null,
        });
    }
    static async getSuperAdminDashboard() {
        const totalSchools = await db_1.prisma.school.count();
        const activeSchools = await db_1.prisma.school.count({ where: { isActive: true } });
        const suspendedSchools = await db_1.prisma.school.count({ where: { isActive: false } });
        const totalStudentsAcrossSchools = await db_1.prisma.student.count({
            where: { status: "Active" },
        });
        const totalTeachersAcrossSchools = await db_1.prisma.teacher.count({
            where: { isActive: true },
        });
        const freeSchools = await db_1.prisma.school.count({
            where: { subscriptionPlan: "Free" },
        });
        const plusSchools = await db_1.prisma.school.count({
            where: { subscriptionPlan: "Plus" },
        });
        const premiumSchools = await db_1.prisma.school.count({
            where: { subscriptionPlan: "Premium" },
        });
        return (0, response_1.successResponse)({
            totalSchools,
            activeSchools,
            suspendedSchools,
            totalStudentsAcrossSchools,
            totalTeachersAcrossSchools,
            planBreakdown: {
                freeSchools,
                plusSchools,
                premiumSchools,
            },
        });
    }
    static async getTeacherDashboard(schoolId, userId) {
        const teacher = await db_1.prisma.teacher.findFirst({
            where: { userId, schoolId },
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
            return (0, response_1.failResponse)("Teacher profile not found.");
        }
        const currentSession = await db_1.prisma.academicSession.findFirst({
            where: { schoolId, isCurrent: true },
        });
        const currentTerm = currentSession
            ? await db_1.prisma.term.findFirst({
                where: { academicSessionId: currentSession.id, isCurrent: true },
            })
            : null;
        const assignments = teacher.subjectAssignments.map((a) => ({
            id: a.id,
            subjectId: a.subjectId,
            subjectName: a.subject ? a.subject.name : "",
            classId: a.classId,
            className: a.class ? `${a.class.name} ${a.class.arm}`.trim() : "",
        }));
        const distinctSubjectIds = new Set(assignments.map((a) => a.subjectId));
        const distinctClassIds = new Set(assignments.map((a) => a.classId));
        return (0, response_1.successResponse)({
            teacherId: teacher.id,
            fullName: teacher.fullName,
            totalAssignedSubjects: distinctSubjectIds.size,
            totalAssignedClasses: distinctClassIds.size,
            currentSession: currentSession?.name || null,
            currentTerm: currentTerm?.termNumber || null,
            assignments,
        });
    }
    static async getStudentDashboard(schoolId, userId) {
        const student = await db_1.prisma.student.findFirst({
            where: { userId, schoolId },
            include: { class: true },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student profile not found.");
        }
        const currentSession = await db_1.prisma.academicSession.findFirst({
            where: { schoolId, isCurrent: true },
        });
        const currentTerm = currentSession
            ? await db_1.prisma.term.findFirst({
                where: { academicSessionId: currentSession.id, isCurrent: true },
            })
            : null;
        return (0, response_1.successResponse)({
            studentId: student.id,
            fullName: student.fullName,
            admissionNumber: student.admissionNumber,
            className: student.class ? student.class.name : null,
            classArm: student.class ? student.class.arm : null,
            currentSession: currentSession?.name || null,
            currentTerm: currentTerm?.termNumber || null,
        });
    }
}
exports.DashboardService = DashboardService;
