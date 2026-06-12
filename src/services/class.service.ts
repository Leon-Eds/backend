import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { emailService } from "../utils/email";

export class ClassService {
  private static mapToResponse(c: any) {
    return {
      id: c.id,
      name: c.name,
      arm: c.arm,
      studentCount: c.students ? c.students.length : 0,
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
    const classes = await prisma.class.findMany({
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
    });

    const items = classes.map((c) => this.mapToResponse(c));
    return successResponse(items);
  }

  static async getClassById(schoolId: string, classId: string) {
    const classEntity = await prisma.class.findFirst({
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
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    return successResponse(this.mapToResponse(classEntity));
  }

  static async createClass(schoolId: string, request: any) {
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

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        name: request.name !== undefined ? request.name : undefined,
        arm: request.arm !== undefined ? request.arm : undefined,
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
