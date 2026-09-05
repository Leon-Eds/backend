import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

type ClassMapping = { sourceClassId: string; targetClassId: string };

export class PromotionService {
  /**
   * Move active students into a new session. Student.classId is only the
   * current-class pointer; StudentEnrollment is the permanent session ledger.
   */
  static async promoteStudents(schoolId: string, mappings: ClassMapping[]) {
    const sourceClassIds = mappings.map((mapping) => mapping.sourceClassId);
    if (new Set(sourceClassIds).size !== sourceClassIds.length) {
      return failResponse("Each source class can only appear once in a promotion request.");
    }
    if (mappings.some((mapping) => mapping.sourceClassId === mapping.targetClassId)) {
      return failResponse("A source class and target class cannot be the same.");
    }

    const requestedClassIds = Array.from(
      new Set(mappings.flatMap((mapping) => [mapping.sourceClassId, mapping.targetClassId]))
    );
    const classes = await prisma.class.findMany({
      where: { schoolId, id: { in: requestedClassIds } },
      include: { academicSession: true },
    });
    const classById = new Map(classes.map((classEntity) => [classEntity.id, classEntity]));
    const missingClassIds = requestedClassIds.filter((classId) => !classById.has(classId));
    if (missingClassIds.length > 0) {
      return failResponse(
        "One or more source or target classes were not found in this school.",
        missingClassIds
      );
    }

    const classWithoutSession = classes.find((classEntity) => !classEntity.academicSessionId);
    if (classWithoutSession) {
      return failResponse(
        `Class ${classWithoutSession.name} ${classWithoutSession.arm} must belong to an academic session before promotion.`.trim()
      );
    }

    const sourceSessionIds = new Set(
      mappings.map((mapping) => classById.get(mapping.sourceClassId)!.academicSessionId!)
    );
    const targetSessionIds = new Set(
      mappings.map((mapping) => classById.get(mapping.targetClassId)!.academicSessionId!)
    );
    if (sourceSessionIds.size !== 1 || targetSessionIds.size !== 1) {
      return failResponse("All source classes must belong to one session and all target classes to one session.");
    }

    const sourceSessionId = Array.from(sourceSessionIds)[0];
    const targetSessionId = Array.from(targetSessionIds)[0];
    if (sourceSessionId === targetSessionId) {
      return failResponse("Promotion must move students from an old session into a different session.");
    }

    const targetSession = classById.get(mappings[0].targetClassId)!.academicSession!;
    if (!targetSession.isCurrent) {
      return failResponse("The target classes must belong to the school's current academic session.");
    }

    const candidates = await prisma.student.findMany({
      where: { schoolId, classId: { in: sourceClassIds }, status: "Active" },
      select: { id: true, classId: true },
    });
    const targetClassByStudentId = new Map(
      candidates.map((student) => [
        student.id,
        mappings.find((mapping) => mapping.sourceClassId === student.classId)!.targetClassId,
      ])
    );
    const existingTargetEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        academicSessionId: targetSessionId,
        studentId: { in: candidates.map((student) => student.id) },
      },
      select: { studentId: true, classId: true },
    });
    if (
      existingTargetEnrollments.some(
        (enrollment) => targetClassByStudentId.get(enrollment.studentId) !== enrollment.classId
      )
    ) {
      return failResponse(
        "A student is already enrolled in a different class in the target session. Resolve that enrollment before promotion."
      );
    }

    const promotedAt = new Date();
    const details = await prisma.$transaction(async (tx) => {
      const promotionDetails: Array<{
        sourceClassId: string;
        sourceClassName: string;
        targetClassId: string;
        targetClassName: string;
        promoted: number;
      }> = [];

      for (const mapping of mappings) {
        const sourceClass = classById.get(mapping.sourceClassId)!;
        const targetClass = classById.get(mapping.targetClassId)!;
        const students = await tx.student.findMany({
          where: { schoolId, classId: mapping.sourceClassId, status: "Active" },
          select: { id: true, enrolledAt: true },
        });

        const studentIds = students.map((student) => student.id);
        if (students.length > 0) {
          await tx.studentEnrollment.createMany({
            data: students.map((student) => ({
              schoolId,
              studentId: student.id,
              academicSessionId: sourceSessionId,
              classId: mapping.sourceClassId,
              promotedToClassId: mapping.targetClassId,
              status: "Promoted",
              startedAt: student.enrolledAt,
              endedAt: promotedAt,
            })),
            skipDuplicates: true,
          });
          await tx.studentEnrollment.updateMany({
            where: { studentId: { in: studentIds }, academicSessionId: sourceSessionId },
            data: {
              classId: mapping.sourceClassId,
              promotedToClassId: mapping.targetClassId,
              status: "Promoted",
              endedAt: promotedAt,
            },
          });
          await tx.studentEnrollment.createMany({
            data: studentIds.map((studentId) => ({
              schoolId,
              studentId,
              academicSessionId: targetSessionId,
              classId: mapping.targetClassId,
              status: "Active",
              startedAt: promotedAt,
            })),
            skipDuplicates: true,
          });
          await tx.studentEnrollment.updateMany({
            where: { studentId: { in: studentIds }, academicSessionId: targetSessionId },
            data: {
              classId: mapping.targetClassId,
              promotedToClassId: null,
              status: "Active",
              endedAt: null,
            },
          });
        }

        const updateResult = await tx.student.updateMany({
          where: {
            schoolId,
            classId: mapping.sourceClassId,
            status: "Active",
            id: { in: studentIds },
          },
          data: { classId: mapping.targetClassId },
        });
        promotionDetails.push({
          sourceClassId: mapping.sourceClassId,
          sourceClassName: `${sourceClass.name} ${sourceClass.arm}`.trim(),
          targetClassId: mapping.targetClassId,
          targetClassName: `${targetClass.name} ${targetClass.arm}`.trim(),
          promoted: updateResult.count,
        });
      }
      return promotionDetails;
    }, { maxWait: 10_000, timeout: 60_000 });

    const totalPromoted = details.reduce((sum, detail) => sum + detail.promoted, 0);
    return successResponse(
      { sourceAcademicSessionId: sourceSessionId, targetAcademicSessionId: targetSessionId, totalPromoted, details },
      `${totalPromoted} students promoted successfully.`
    );
  }

  static async graduateClass(schoolId: string, classId: string) {
    const classEntity = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!classEntity) return failResponse("Class not found.");
    if (!classEntity.academicSessionId) {
      return failResponse("The class must belong to an academic session before graduation.");
    }

    const graduatedAt = new Date();
    const graduatedCount = await prisma.$transaction(async (tx) => {
      const students = await tx.student.findMany({
        where: { schoolId, classId, status: "Active" },
        select: { id: true, userId: true, enrolledAt: true },
      });
      const studentIds = students.map((student) => student.id);
      if (students.length > 0) {
        await tx.studentEnrollment.createMany({
          data: students.map((student) => ({
            schoolId,
            studentId: student.id,
            academicSessionId: classEntity.academicSessionId!,
            classId,
            status: "Graduated",
            startedAt: student.enrolledAt,
            endedAt: graduatedAt,
          })),
          skipDuplicates: true,
        });
        await tx.studentEnrollment.updateMany({
          where: {
            studentId: { in: studentIds },
            academicSessionId: classEntity.academicSessionId!,
          },
          data: { classId, status: "Graduated", endedAt: graduatedAt },
        });
      }
      const updated = await tx.student.updateMany({
        where: { schoolId, classId, status: "Active" },
        data: { status: "Graduated" },
      });
      const userIds = students.flatMap((student) => (student.userId ? [student.userId] : []));
      if (userIds.length > 0) {
        await tx.user.updateMany({ where: { id: { in: userIds } }, data: { isActive: false } });
      }
      return updated.count;
    }, { maxWait: 10_000, timeout: 60_000 });

    return successResponse(
      { classId, className: `${classEntity.name} ${classEntity.arm}`.trim(), graduatedCount },
      `${graduatedCount} students graduated successfully.`
    );
  }

  static async markStudentLeft(schoolId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: true },
    });
    if (!student) return failResponse("Student not found.");
    if (student.status === "Left") return failResponse("Student is already marked as Left.");

    const leftAt = new Date();
    await prisma.$transaction(async (tx) => {
      if (student.classId && student.class?.academicSessionId) {
        await tx.studentEnrollment.upsert({
          where: {
            studentId_academicSessionId: {
              studentId,
              academicSessionId: student.class.academicSessionId,
            },
          },
          create: {
            schoolId,
            studentId,
            academicSessionId: student.class.academicSessionId,
            classId: student.classId,
            status: "Left",
            startedAt: student.enrolledAt,
            endedAt: leftAt,
          },
          update: { classId: student.classId, status: "Left", endedAt: leftAt },
        });
      }
      await tx.student.update({ where: { id: studentId }, data: { status: "Left" } });
      if (student.userId) {
        await tx.user.update({ where: { id: student.userId }, data: { isActive: false } });
      }
    });
    return successResponse(true, "Student has been marked as Left. Historical records are preserved.");
  }

  static async getStudentEnrollmentHistory(schoolId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, fullName: true, admissionNumber: true },
    });
    if (!student) return failResponse("Student not found.");

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { schoolId, studentId },
      include: { academicSession: true, class: true, promotedToClass: true },
      orderBy: { academicSession: { startDate: "desc" } },
    });
    return successResponse({
      student,
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        academicSessionId: enrollment.academicSessionId,
        academicSessionName: enrollment.academicSession.name,
        classId: enrollment.classId,
        className: `${enrollment.class.name} ${enrollment.class.arm}`.trim(),
        promotedToClassId: enrollment.promotedToClassId,
        promotedToClassName: enrollment.promotedToClass
          ? `${enrollment.promotedToClass.name} ${enrollment.promotedToClass.arm}`.trim()
          : null,
        status: enrollment.status,
        startedAt: enrollment.startedAt,
        endedAt: enrollment.endedAt,
      })),
    });
  }
}
