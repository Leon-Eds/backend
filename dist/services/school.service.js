"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class SchoolService {
    static getPlanLimits(plan) {
        switch (plan) {
            case "Plus":
                return { maxTeachers: 30, maxStudents: 200 };
            case "Premium":
                return { maxTeachers: 999999, maxStudents: 999999 };
            case "Free":
            default:
                return { maxTeachers: 20, maxStudents: 100 };
        }
    }
    static mapToResponse(school) {
        const limits = this.getPlanLimits(school.subscriptionPlan);
        const currentTeacherCount = school.teachers ? school.teachers.filter((t) => t.isActive).length : 0;
        const currentStudentCount = school.students ? school.students.filter((s) => s.status === "Active").length : 0;
        return {
            id: school.id,
            name: school.name,
            address: school.address,
            contactEmail: school.contactEmail,
            contactPhone: school.contactPhone,
            logoUrl: school.logoUrl,
            slug: school.slug,
            subscriptionPlan: school.subscriptionPlan,
            subscriptionStatus: school.subscriptionStatus,
            isActive: school.isActive,
            maxTeachers: limits.maxTeachers,
            maxStudents: limits.maxStudents,
            currentTeacherCount,
            currentStudentCount,
            createdAt: school.createdAt,
        };
    }
    static async getAllSchools(params) {
        const pageNumber = parseInt(params.pageNumber || "1", 10);
        const pageSize = parseInt(params.pageSize || "20", 10);
        const search = params.search ? params.search.toLowerCase() : "";
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { contactEmail: { contains: search, mode: "insensitive" } },
            ];
        }
        const totalCount = await db_1.prisma.school.count({ where });
        const schools = await db_1.prisma.school.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (pageNumber - 1) * pageSize,
            take: pageSize,
            include: {
                teachers: { select: { isActive: true } },
                students: { select: { status: true } },
            },
        });
        const items = schools.map((s) => this.mapToResponse(s));
        const pagedResult = (0, response_1.createPagedResult)(items, totalCount, pageNumber, pageSize);
        return (0, response_1.successResponse)(pagedResult);
    }
    static async getSchoolById(id) {
        const school = await db_1.prisma.school.findUnique({
            where: { id },
            include: {
                teachers: { select: { isActive: true } },
                students: { select: { status: true } },
            },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        return (0, response_1.successResponse)(this.mapToResponse(school));
    }
    static async updateSchool(id, request) {
        const school = await db_1.prisma.school.findUnique({
            where: { id },
            include: {
                teachers: { select: { isActive: true } },
                students: { select: { status: true } },
            },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        const updatedSchool = await db_1.prisma.school.update({
            where: { id },
            data: {
                name: request.name !== undefined ? request.name : undefined,
                address: request.address !== undefined ? request.address : undefined,
                contactEmail: request.contactEmail !== undefined ? request.contactEmail : undefined,
                contactPhone: request.contactPhone !== undefined ? request.contactPhone : undefined,
                logoUrl: request.logoUrl !== undefined ? request.logoUrl : undefined,
            },
            include: {
                teachers: { select: { isActive: true } },
                students: { select: { status: true } },
            },
        });
        return (0, response_1.successResponse)(this.mapToResponse(updatedSchool), "School updated successfully.");
    }
    static async updateSchoolPlan(schoolId, plan) {
        const school = await db_1.prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                teachers: { select: { isActive: true } },
                students: { select: { status: true } },
            },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        const updatedSchool = await db_1.prisma.school.update({
            where: { id: schoolId },
            data: { subscriptionPlan: plan },
            include: {
                teachers: { select: { isActive: true } },
                students: { select: { status: true } },
            },
        });
        return (0, response_1.successResponse)(this.mapToResponse(updatedSchool), "Subscription plan updated successfully.");
    }
    static async updateSchoolStatus(schoolId, isActive) {
        const school = await db_1.prisma.school.findUnique({
            where: { id: schoolId },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        await db_1.prisma.school.update({
            where: { id: schoolId },
            data: {
                isActive,
                subscriptionStatus: isActive ? "Active" : "Suspended",
            },
        });
        const message = isActive ? "School activated successfully." : "School suspended successfully.";
        return (0, response_1.successResponse)(true, message);
    }
    static async getSubscriptionPlans() {
        return [
            {
                name: "Free",
                maxTeachers: 20,
                maxStudents: 100,
                description: "Basic plan with up to 20 teachers and 100 students.",
            },
            {
                name: "Plus",
                maxTeachers: 30,
                maxStudents: 200,
                description: "Enhanced plan with up to 30 teachers and 200 students.",
            },
            {
                name: "Premium",
                maxTeachers: 999999,
                maxStudents: 999999,
                description: "Unlimited teachers and students.",
            },
        ];
    }
}
exports.SchoolService = SchoolService;
