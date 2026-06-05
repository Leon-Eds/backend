import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class SubjectService {
  static async getSubjects(schoolId: string) {
    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      include: {
        classSubjects: true,
      },
      orderBy: { name: "asc" },
    });

    const items = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      classCount: s.classSubjects ? s.classSubjects.length : 0,
      createdAt: s.createdAt,
    }));

    return successResponse(items);
  }

  static async createSubject(schoolId: string, request: any) {
    const existing = await prisma.subject.findFirst({
      where: {
        schoolId,
        name: { equals: request.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return failResponse("Subject already exists in this school.");
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId,
        name: request.name,
      },
    });

    return successResponse(
      {
        id: subject.id,
        name: subject.name,
        classCount: 0,
        createdAt: subject.createdAt,
      },
      "Subject created successfully."
    );
  }

  static async updateSubject(schoolId: string, subjectId: string, request: any) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
      include: { classSubjects: true },
    });

    if (!subject) {
      return failResponse("Subject not found.");
    }

    const existingName = await prisma.subject.findFirst({
      where: {
        schoolId,
        id: { not: subjectId },
        name: { equals: request.name, mode: "insensitive" },
      },
    });

    if (existingName) {
      return failResponse("Another subject with this name already exists.");
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: { name: request.name },
    });

    return successResponse(
      {
        id: updated.id,
        name: updated.name,
        classCount: subject.classSubjects ? subject.classSubjects.length : 0,
        createdAt: updated.createdAt,
      },
      "Subject updated successfully."
    );
  }

  static async deleteSubject(schoolId: string, subjectId: string) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      return failResponse("Subject not found.");
    }

    await prisma.subject.delete({
      where: { id: subjectId },
    });

    return successResponse(true, "Subject deleted successfully.");
  }
}
