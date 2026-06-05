import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class GradingService {
  private static readonly DefaultRules = [
    { grade: "A" as const, min: 70, max: 100, remark: "Excellent" },
    { grade: "B" as const, min: 60, max: 69, remark: "Very Good" },
    { grade: "C" as const, min: 50, max: 59, remark: "Good" },
    { grade: "D" as const, min: 45, max: 49, remark: "Fair" },
    { grade: "E" as const, min: 40, max: 44, remark: "Pass" },
    { grade: "F" as const, min: 0, max: 39, remark: "Fail" },
  ];

  static async setGradingRules(schoolId: string, request: any) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    // Delete existing rules for this school, then insert new ones in transaction
    await prisma.$transaction([
      prisma.gradingRule.deleteMany({
        where: { schoolId },
      }),
      prisma.gradingRule.createMany({
        data: request.rules.map((r: any) => ({
          schoolId,
          grade: r.grade,
          minScore: r.minScore,
          maxScore: r.maxScore,
          remark: r.remark || "",
        })),
      }),
    ]);

    const newRules = await prisma.gradingRule.findMany({
      where: { schoolId },
    });

    const response = newRules.map((r) => ({
      id: r.id,
      grade: r.grade,
      minScore: r.minScore,
      maxScore: r.maxScore,
      remark: r.remark,
    }));

    return successResponse(response, "Grading rules updated successfully.");
  }

  static async getGradingRules(schoolId: string) {
    const rules = await prisma.gradingRule.findMany({
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
      return successResponse(defaults, "Default grading rules (no custom rules configured).");
    }

    const response = rules.map((r) => ({
      id: r.id,
      grade: r.grade,
      minScore: r.minScore,
      maxScore: r.maxScore,
      remark: r.remark,
    }));

    return successResponse(response, "Grading rules retrieved.");
  }

  static async getGrade(schoolId: string, score: number): Promise<"A" | "B" | "C" | "D" | "E" | "F"> {
    const rules = await prisma.gradingRule.findMany({
      where: { schoolId },
    });

    const intScore = Math.round(score);

    if (rules.length > 0) {
      const match = rules.find((r) => intScore >= r.minScore && intScore <= r.maxScore);
      return (match?.grade as any) || "F";
    }

    const defaultMatch = this.DefaultRules.find((r) => intScore >= r.min && intScore <= r.max);
    return defaultMatch ? defaultMatch.grade : "F";
  }

  static async getRemark(schoolId: string, score: number): Promise<string> {
    const rules = await prisma.gradingRule.findMany({
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
