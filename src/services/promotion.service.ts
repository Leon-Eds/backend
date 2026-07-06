import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class PromotionService {

  /**
   * Bulk promote students from source classes to target classes.
   * mappings: [{ sourceClassId, targetClassId }]
   */
  static async promoteStudents(schoolId: string, mappings: { sourceClassId: string; targetClassId: string }[]) {
    const results: any[] = [];

    for (const mapping of mappings) {
      const sourceClass = await prisma.class.findFirst({
        where: { id: mapping.sourceClassId, schoolId },
      });

      if (!sourceClass) {
        results.push({
          sourceClassId: mapping.sourceClassId,
          error: "Source class not found.",
          promoted: 0,
        });
        continue;
      }

      const targetClass = await prisma.class.findFirst({
        where: { id: mapping.targetClassId, schoolId },
      });

      if (!targetClass) {
        results.push({
          sourceClassId: mapping.sourceClassId,
          sourceClassName: `${sourceClass.name} ${sourceClass.arm}`.trim(),
          error: "Target class not found.",
          promoted: 0,
        });
        continue;
      }

      // Move all active students from source to target
      const updateResult = await prisma.student.updateMany({
        where: {
          schoolId,
          classId: mapping.sourceClassId,
          status: "Active",
        },
        data: {
          classId: mapping.targetClassId,
        },
      });

      results.push({
        sourceClassId: mapping.sourceClassId,
        sourceClassName: `${sourceClass.name} ${sourceClass.arm}`.trim(),
        targetClassId: mapping.targetClassId,
        targetClassName: `${targetClass.name} ${targetClass.arm}`.trim(),
        promoted: updateResult.count,
      });
    }

    const totalPromoted = results.reduce((sum, r) => sum + (r.promoted || 0), 0);
    return successResponse({ totalPromoted, details: results }, `${totalPromoted} students promoted successfully.`);
  }

  /**
   * Graduate all active students in a class
   */
  static async graduateClass(schoolId: string, classId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const updateResult = await prisma.student.updateMany({
      where: {
        schoolId,
        classId,
        status: "Active",
      },
      data: {
        status: "Graduated",
      },
    });

    // Deactivate their user accounts
    const graduatedStudents = await prisma.student.findMany({
      where: { schoolId, classId, status: "Graduated" },
      select: { userId: true },
    });

    for (const student of graduatedStudents) {
      if (student.userId) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { isActive: false },
        });
      }
    }

    return successResponse({
      classId,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      graduatedCount: updateResult.count,
    }, `${updateResult.count} students graduated successfully.`);
  }

  /**
   * Mark a single student as Left (preserves all historical records)
   */
  static async markStudentLeft(schoolId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    if (student.status === "Left") {
      return failResponse("Student is already marked as Left.");
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { status: "Left" },
    });

    if (student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      });
    }

    return successResponse(true, "Student has been marked as Left. Historical records are preserved.");
  }
}
