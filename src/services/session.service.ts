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

  static async updateSession(schoolId: string, sessionId: string, request: any) {
    const session = await prisma.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      return failResponse("Academic session not found.");
    }

    const data: any = {};
    if (request.name !== undefined) data.name = request.name;
    if (request.startDate !== undefined) data.startDate = new Date(request.startDate);
    if (request.endDate !== undefined) data.endDate = new Date(request.endDate);

    const updated = await prisma.academicSession.update({
      where: { id: sessionId },
      data,
      include: { terms: true },
    });

    return successResponse(this.mapToResponse(updated), "Academic session updated successfully.");
  }

  static async deleteSession(schoolId: string, sessionId: string) {
    const session = await prisma.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      return failResponse("Academic session not found.");
    }

    // Check references to prevent foreign key errors for NoAction relations
    const scoreCount = await prisma.score.count({
      where: { academicSessionId: sessionId },
    });
    const resultCount = await prisma.result.count({
      where: { academicSessionId: sessionId },
    });
    const feeCount = await prisma.feePayment.count({
      where: { academicSessionId: sessionId },
    });

    if (scoreCount > 0 || resultCount > 0 || feeCount > 0) {
      return failResponse(
        "Cannot delete academic session because it is referenced by existing scores, results, or fee payments."
      );
    }

    await prisma.academicSession.delete({
      where: { id: sessionId },
    });

    return successResponse(true, "Academic session deleted successfully.");
  }

  static async updateTerm(schoolId: string, termId: string, request: any) {
    const term = await prisma.term.findFirst({
      where: {
        id: termId,
        academicSession: { schoolId },
      },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    const data: any = {};
    if (request.termNumber !== undefined) {
      // Check if another term in the same session has this termNumber
      const termExists = await prisma.term.findFirst({
        where: {
          academicSessionId: term.academicSessionId,
          termNumber: request.termNumber,
          NOT: { id: termId },
        },
      });

      if (termExists) {
        return failResponse("This term number already exists in this session.");
      }
      data.termNumber = request.termNumber;
    }
    if (request.startDate !== undefined) data.startDate = new Date(request.startDate);
    if (request.endDate !== undefined) data.endDate = new Date(request.endDate);

    const updated = await prisma.term.update({
      where: { id: termId },
      data,
    });

    return successResponse(
      {
        id: updated.id,
        termNumber: updated.termNumber,
        startDate: updated.startDate,
        endDate: updated.endDate,
        isCurrent: updated.isCurrent,
      },
      "Term updated successfully."
    );
  }

  static async deleteTerm(schoolId: string, termId: string) {
    const term = await prisma.term.findFirst({
      where: {
        id: termId,
        academicSession: { schoolId },
      },
    });

    if (!term) {
      return failResponse("Term not found.");
    }

    // Check references to prevent foreign key errors for NoAction relations
    const scoreCount = await prisma.score.count({
      where: { termId },
    });
    const resultCount = await prisma.result.count({
      where: { termId },
    });
    const feeCount = await prisma.feePayment.count({
      where: { termId },
    });

    if (scoreCount > 0 || resultCount > 0 || feeCount > 0) {
      return failResponse(
        "Cannot delete term because it is referenced by existing scores, results, or fee payments."
      );
    }

    await prisma.term.delete({
      where: { id: termId },
    });

    return successResponse(true, "Term deleted successfully.");
  }
}
