"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class GradingService {
    static DefaultRules = [
        { grade: "A", min: 70, max: 100, remark: "Excellent" },
        { grade: "B", min: 60, max: 69, remark: "Very Good" },
        { grade: "C", min: 50, max: 59, remark: "Good" },
        { grade: "D", min: 45, max: 49, remark: "Fair" },
        { grade: "E", min: 40, max: 44, remark: "Pass" },
        { grade: "F", min: 0, max: 39, remark: "Fail" },
    ];
    static async setGradingRules(schoolId, request) {
        const school = await db_1.prisma.school.findUnique({
            where: { id: schoolId },
        });
        if (!school) {
            return (0, response_1.failResponse)("School not found.");
        }
        // Delete existing rules for this school, then insert new ones in transaction
        await db_1.prisma.$transaction([
            db_1.prisma.gradingRule.deleteMany({
                where: { schoolId },
            }),
            db_1.prisma.gradingRule.createMany({
                data: request.rules.map((r) => ({
                    schoolId,
                    grade: r.grade,
                    minScore: r.minScore,
                    maxScore: r.maxScore,
                    remark: r.remark || "",
                })),
            }),
        ]);
        const newRules = await db_1.prisma.gradingRule.findMany({
            where: { schoolId },
        });
        const response = newRules.map((r) => ({
            id: r.id,
            grade: r.grade,
            minScore: r.minScore,
            maxScore: r.maxScore,
            remark: r.remark,
        }));
        return (0, response_1.successResponse)(response, "Grading rules updated successfully.");
    }
    static async getGradingRules(schoolId) {
        const rules = await db_1.prisma.gradingRule.findMany({
            where: { schoolId },
            orderBy: { maxScore: "desc" },
        });
        if (rules.length === 0) {
            const defaults = this.DefaultRules.map((r) => ({
                id: "00000000-0000-0000-0000-000000000000",
                grade: r.grade,
                minScore: r.min,
                maxScore: r.max,
                remark: r.remark,
            }));
            return (0, response_1.successResponse)(defaults, "Default grading rules (no custom rules configured).");
        }
        const response = rules.map((r) => ({
            id: r.id,
            grade: r.grade,
            minScore: r.minScore,
            maxScore: r.maxScore,
            remark: r.remark,
        }));
        return (0, response_1.successResponse)(response, "Grading rules retrieved.");
    }
    static async getGrade(schoolId, score) {
        const rules = await db_1.prisma.gradingRule.findMany({
            where: { schoolId },
        });
        const intScore = Math.round(score);
        if (rules.length > 0) {
            const match = rules.find((r) => intScore >= r.minScore && intScore <= r.maxScore);
            return match?.grade || "F";
        }
        const defaultMatch = this.DefaultRules.find((r) => intScore >= r.min && intScore <= r.max);
        return defaultMatch ? defaultMatch.grade : "F";
    }
    static async getRemark(schoolId, score) {
        const rules = await db_1.prisma.gradingRule.findMany({
            where: { schoolId },
        });
        const intScore = Math.round(score);
        if (rules.length > 0) {
            const match = rules.find((r) => intScore >= r.minScore && intScore <= r.maxScore);
            return match?.remark || "Fail";
        }
        const defaultMatch = this.DefaultRules.find((r) => intScore >= r.min && intScore <= r.max);
        return defaultMatch ? defaultMatch.remark : "Fail";
    }
}
exports.GradingService = GradingService;
