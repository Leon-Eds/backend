import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { emailService } from "../utils/email";

export class AcademicSessionService {
  private static mapToResponse(s: any) {
    const terms = s.terms
      ? s.terms
          .sort((a: any, b: any) => {
            const order: Record<string, number> = { First: 1, Second: 2, Third: 3 };
            return order[a.termNumber] - order[b.termNumber];
          })
          .map((t: any) => ({
            id: t.id,
            termNumber: t.termNumber,
            startDate: t.startDate,
            endDate: t.endDate,
            isCurrent: t.isCurrent,
          }))
      : [];

    return {
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      isCurrent: s.isCurrent,
      createdAt: s.createdAt,
      terms,
    };
  }

  static async getSessions(schoolId: string) {
    const sessions = await prisma.academicSession.findMany({
      where: { schoolId },
      include: {
        terms: true,
      },
      orderBy: { startDate: "desc" },
    });

    const items = sessions.map((s) => this.mapToResponse(s));
    return successResponse(items);
  }

  static async createSession(schoolId: string, request: any) {
    const session = await prisma.academicSession.create({
      data: {
        schoolId,
        name: request.name,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        isCurrent: false,
      },
      include: {
        terms: true,
      },
    });

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, contactEmail: true },
    });

    if (school && school.contactEmail) {
      emailService.sendSessionCreatedNotification(
        school.contactEmail,
        school.name,
        session.name,
        session.startDate,
        session.endDate
      ).catch((err) => console.error("[AcademicSessionService] Session creation notification email error:", err));
    }

    return successResponse(this.mapToResponse(session), "Academic session created successfully.");
  }

  static async setCurrentSession(schoolId: string, sessionId: string) {
    const sessions = await prisma.academicSession.findMany({
      where: { schoolId },
    });

    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      return failResponse("Session not found.");
    }

    await prisma.$transaction([
      prisma.academicSession.updateMany({
        where: { schoolId },
        data: { isCurrent: false },
      }),
      prisma.academicSession.update({
        where: { id: sessionId },
        data: { isCurrent: true },
      }),
    ]);

    return successResponse(true, "Current session set successfully.");
  }

  static async createTerm(schoolId: string, sessionId: string, request: any) {
    const session = await prisma.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      return failResponse("Session not found.");
    }

    const termExists = await prisma.term.findFirst({
      where: {
        academicSessionId: sessionId,
        termNumber: request.termNumber,
      },
    });

    if (termExists) {
      return failResponse("This term already exists in the session.");
    }

    const term = await prisma.term.create({
      data: {
        academicSessionId: sessionId,
        termNumber: request.termNumber,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        isCurrent: false,
      },
    });

    return successResponse(
      {
        id: term.id,
        termNumber: term.termNumber,
        startDate: term.startDate,
        endDate: term.endDate,
        isCurrent: term.isCurrent,
      },
      "Term created successfully."
    );
  }

  static async setCurrentTerm(schoolId: string, termId: string) {
    const term = await prisma.term.findFirst({
      where: {
        id: termId,
        academicSession: { schoolId },
      },
      include: { academicSession: true },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    await prisma.$transaction([
      prisma.term.updateMany({
        where: { academicSessionId: term.academicSessionId },
        data: { isCurrent: false },
      }),
      prisma.term.update({
        where: { id: termId },
        data: { isCurrent: true },
      }),
    ]);

    return successResponse(true, "Current term set successfully.");
  }
}
