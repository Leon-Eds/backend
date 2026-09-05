import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { emailService } from "../utils/email";

export class ClassService {
  private static mapToResponse(c: any, presentTodayCount = 0) {
    const totalStudents = c.students ? c.students.filter((s: any) => s.status === "Active" || !s.status).length : 0;
    return {
      id: c.id,
      name: c.name,
      arm: c.arm,
      studentCount: totalStudents,
      totalStudents,
      presentToday: presentTodayCount,
      presentCount: presentTodayCount,
      academicSessionId: c.academicSessionId,
      academicSessionName: c.academicSession?.name || null,
      formTeacherId: c.formTeacherId || null,
      formTeacherName: c.formTeacher?.fullName || null,
      subjects: c.classSubjects
        ? c.classSubjects.map((cs: any) => ({
            subjectId: cs.subjectId,
            subjectName: cs.subject?.name || "",
          }))
        : [],
      createdAt: c.createdAt,
    };
  }

  static async getClasses(schoolId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [classes, todayAttendances] = await Promise.all([
      prisma.class.findMany({
        where: { schoolId },
        include: {
          students: true,
          classSubjects: {
            include: {
              subject: true,
            },
          },
          academicSession: true,
          formTeacher: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.attendance.groupBy({
        by: ["classId"],
        where: {
          schoolId,
          date: today,
          status: "Present",
        },
        _count: {
          studentId: true,
        },
      }),
    ]);

    const attendanceMap = new Map<string, number>();
    for (const att of todayAttendances) {
      attendanceMap.set(att.classId, att._count.studentId);
    }

    const items = classes.map((c) => this.mapToResponse(c, attendanceMap.get(c.id) || 0));
    return successResponse(items);
  }

  static async getClassById(schoolId: string, classId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [classEntity, presentCount] = await Promise.all([
      prisma.class.findFirst({
        where: { id: classId, schoolId },
        include: {
          students: true,
          classSubjects: {
            include: {
              subject: true,
            },
          },
          academicSession: true,
          formTeacher: true,
        },
      }),
      prisma.attendance.count({
        where: {
          schoolId,
          classId,
          date: today,
          status: "Present",
        },
      }),
    ]);

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    return successResponse(this.mapToResponse(classEntity, presentCount));
  }

  static async createClass(schoolId: string, request: any) {
    if (request.academicSessionId) {
      const session = await prisma.academicSession.findFirst({
        where: { id: request.academicSessionId, schoolId },
        select: { id: true },
      });
      if (!session) return failResponse("Academic session not found in this school.");
    }

    const classEntity = await prisma.class.create({
      data: {
        schoolId,
        name: request.name,
        arm: request.arm || "",
        academicSessionId: request.academicSessionId || null,
        formTeacherId: request.formTeacherId || null,
      },
      include: {
        students: true,
        classSubjects: {
          include: {
            subject: true,
          },
        },
        academicSession: true,
        formTeacher: true,
      },
    });

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, contactEmail: true },
    });

    if (school && school.contactEmail) {
      emailService.sendClassCreatedNotification(
        school.contactEmail,
        school.name,
        classEntity.name,
        classEntity.arm
      ).catch((err) => console.error("[ClassService] Class creation notification email error:", err));
    }

    return successResponse(this.mapToResponse(classEntity), "Class created successfully.");
  }

  static async updateClass(schoolId: string, classId: string, request: any) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    if (
      request.academicSessionId !== undefined &&
      classEntity.academicSessionId &&
      request.academicSessionId !== classEntity.academicSessionId
    ) {
      return failResponse(
        "A class already assigned to an academic session cannot be moved. Create a new class for the new session."
      );
    }
    if (request.academicSessionId && !classEntity.academicSessionId) {
      const session = await prisma.academicSession.findFirst({
        where: { id: request.academicSessionId, schoolId },
        select: { id: true },
      });
      if (!session) return failResponse("Academic session not found in this school.");
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        name: request.name !== undefined ? request.name : undefined,
        arm: request.arm !== undefined ? request.arm : undefined,
        academicSessionId:
          request.academicSessionId !== undefined ? request.academicSessionId : undefined,
        formTeacherId: request.formTeacherId !== undefined ? request.formTeacherId : undefined,
      },
      include: {
        students: true,
        classSubjects: {
          include: {
            subject: true,
          },
        },
        academicSession: true,
        formTeacher: true,
      },
    });

    if (request.academicSessionId && !classEntity.academicSessionId) {
      const activeStudents = await prisma.student.findMany({
        where: { schoolId, classId, status: "Active" },
        select: { id: true, enrolledAt: true },
      });
      if (activeStudents.length > 0) {
        await prisma.studentEnrollment.createMany({
          data: activeStudents.map((student) => ({
            schoolId,
            studentId: student.id,
            academicSessionId: request.academicSessionId,
            classId,
            status: "Active",
            startedAt: student.enrolledAt,
          })),
          skipDuplicates: true,
        });
      }
    }

    return successResponse(this.mapToResponse(updated), "Class updated successfully.");
  }

  static async deleteClass(schoolId: string, classId: string) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        students: true,
      },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    if (classEntity.students.length > 0) {
      return failResponse("Cannot delete a class with students. Reassign them first.");
    }

    const enrollmentCount = await prisma.studentEnrollment.count({
      where: {
        OR: [{ classId }, { promotedToClassId: classId }],
      },
    });
    if (enrollmentCount > 0) {
      return failResponse("Cannot delete a class that is referenced by student enrollment history.");
    }

    await prisma.class.delete({
      where: { id: classId },
    });

    return successResponse(true, "Class deleted successfully.");
  }

  static async assignSubjectsToClass(schoolId: string, classId: string, request: any) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    const subjectIds: string[] = request.subjectIds || [];

    // Verify all subjectIds exist in this school
    for (const subjectId of subjectIds) {
      const subjectExists = await prisma.subject.findFirst({
        where: { id: subjectId, schoolId },
      });
      if (!subjectExists) {
        return failResponse(`Subject ${subjectId} not found in this school.`);
      }
    }

    // Delete existing class subjects, then recreate them in transaction
    await prisma.$transaction([
      prisma.classSubject.deleteMany({
        where: { classId },
      }),
      prisma.classSubject.createMany({
        data: Array.from(new Set(subjectIds)).map((subjId) => ({
          classId,
          subjectId: subjId,
        })),
      }),
    ]);

    const updated = await prisma.class.findFirst({
      where: { id: classId },
      include: {
        students: true,
        classSubjects: {
          include: {
            subject: true,
          },
        },
        academicSession: true,
        formTeacher: true,
      },
    });

    return successResponse(this.mapToResponse(updated), "Subjects assigned to class successfully.");
  }
}
