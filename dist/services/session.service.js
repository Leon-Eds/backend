"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicSessionService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class AcademicSessionService {
    static mapToResponse(s) {
        const terms = s.terms
            ? s.terms
                .sort((a, b) => {
                const order = { First: 1, Second: 2, Third: 3 };
                return order[a.termNumber] - order[b.termNumber];
            })
                .map((t) => ({
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
    static async getSessions(schoolId) {
        const sessions = await db_1.prisma.academicSession.findMany({
            where: { schoolId },
            include: {
                terms: true,
            },
            orderBy: { startDate: "desc" },
        });
        const items = sessions.map((s) => this.mapToResponse(s));
        return (0, response_1.successResponse)(items);
    }
    static async createSession(schoolId, request) {
        const session = await db_1.prisma.academicSession.create({
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
        return (0, response_1.successResponse)(this.mapToResponse(session), "Academic session created successfully.");
    }
    static async setCurrentSession(schoolId, sessionId) {
        const sessions = await db_1.prisma.academicSession.findMany({
            where: { schoolId },
        });
        const target = sessions.find((s) => s.id === sessionId);
        if (!target) {
            return (0, response_1.failResponse)("Session not found.");
        }
        await db_1.prisma.$transaction([
            db_1.prisma.academicSession.updateMany({
                where: { schoolId },
                data: { isCurrent: false },
            }),
            db_1.prisma.academicSession.update({
                where: { id: sessionId },
                data: { isCurrent: true },
            }),
        ]);
        return (0, response_1.successResponse)(true, "Current session set successfully.");
    }
    static async createTerm(schoolId, sessionId, request) {
        const session = await db_1.prisma.academicSession.findFirst({
            where: { id: sessionId, schoolId },
        });
        if (!session) {
            return (0, response_1.failResponse)("Session not found.");
        }
        const termExists = await db_1.prisma.term.findFirst({
            where: {
                academicSessionId: sessionId,
                termNumber: request.termNumber,
            },
        });
        if (termExists) {
            return (0, response_1.failResponse)("This term already exists in the session.");
        }
        const term = await db_1.prisma.term.create({
            data: {
                academicSessionId: sessionId,
                termNumber: request.termNumber,
                startDate: new Date(request.startDate),
                endDate: new Date(request.endDate),
                isCurrent: false,
            },
        });
        return (0, response_1.successResponse)({
            id: term.id,
            termNumber: term.termNumber,
            startDate: term.startDate,
            endDate: term.endDate,
            isCurrent: term.isCurrent,
        }, "Term created successfully.");
    }
    static async setCurrentTerm(schoolId, termId) {
        const term = await db_1.prisma.term.findFirst({
            where: {
                id: termId,
                academicSession: { schoolId },
            },
            include: { academicSession: true },
        });
        if (!term) {
            return (0, response_1.failResponse)("Term not found.");
        }
        await db_1.prisma.$transaction([
            db_1.prisma.term.updateMany({
                where: { academicSessionId: term.academicSessionId },
                data: { isCurrent: false },
            }),
            db_1.prisma.term.update({
                where: { id: termId },
                data: { isCurrent: true },
            }),
        ]);
        return (0, response_1.successResponse)(true, "Current term set successfully.");
    }
}
exports.AcademicSessionService = AcademicSessionService;
