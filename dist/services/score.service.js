"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreService = void 0;
const db_1 = require("../config/db");
const grading_service_1 = require("./grading.service");
const response_1 = require("../utils/response");
class ScoreService {
    static mapToResponse(s, student, subjectName) {
        return {
            id: s.id,
            studentId: s.studentId,
            studentName: student.fullName,
            admissionNumber: student.admissionNumber,
            subjectId: s.subjectId,
            subjectName,
            firstCA: Number(s.firstCA),
            secondCA: Number(s.secondCA),
            exam: Number(s.exam),
            total: Number(s.total),
            grade: s.grade,
            remark: s.remark,
        };
    }
    static async enterScore(schoolId, teacherId, request) {
        const student = await db_1.prisma.student.findFirst({
            where: { id: request.studentId, schoolId },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student not found in this school.");
        }
        const subject = await db_1.prisma.subject.findFirst({
            where: { id: request.subjectId, schoolId },
        });
        if (!subject) {
            return (0, response_1.failResponse)("Subject not found in this school.");
        }
        const total = request.firstCA + request.secondCA + request.exam;
        const grade = await grading_service_1.GradingService.getGrade(schoolId, total);
        const existing = await db_1.prisma.score.findFirst({
            where: {
                schoolId,
                studentId: request.studentId,
                subjectId: request.subjectId,
                termId: request.termId,
            },
        });
        let scoreRecord;
        if (existing) {
            scoreRecord = await db_1.prisma.score.update({
                where: { id: existing.id },
                data: {
                    firstCA: request.firstCA,
                    secondCA: request.secondCA,
                    exam: request.exam,
                    total,
                    grade,
                    remark: request.remark || "",
                    enteredByTeacherId: teacherId || null,
                },
            });
        }
        else {
            scoreRecord = await db_1.prisma.score.create({
                data: {
                    schoolId,
                    studentId: request.studentId,
                    subjectId: request.subjectId,
                    classId: request.classId,
                    termId: request.termId,
                    academicSessionId: request.academicSessionId,
                    firstCA: request.firstCA,
                    secondCA: request.secondCA,
                    exam: request.exam,
                    total,
                    grade,
                    remark: request.remark || "",
                    enteredByTeacherId: teacherId || null,
                },
            });
        }
        return (0, response_1.successResponse)(this.mapToResponse(scoreRecord, student, subject.name), "Score entered successfully.");
    }
    static async bulkEnterScores(schoolId, teacherId, request) {
        const subject = await db_1.prisma.subject.findFirst({
            where: { id: request.subjectId, schoolId },
        });
        if (!subject) {
            return (0, response_1.failResponse)("Subject not found in this school.");
        }
        const responses = [];
        // Run sequentially to ensure proper database locking/transactions or simplicity
        for (const entry of request.scores) {
            const student = await db_1.prisma.student.findFirst({
                where: { id: entry.studentId, schoolId },
            });
            if (!student)
                continue;
            const total = entry.firstCA + entry.secondCA + entry.exam;
            const grade = await grading_service_1.GradingService.getGrade(schoolId, total);
            const existing = await db_1.prisma.score.findFirst({
                where: {
                    schoolId,
                    studentId: entry.studentId,
                    subjectId: request.subjectId,
                    termId: request.termId,
                },
            });
            let scoreRecord;
            if (existing) {
                scoreRecord = await db_1.prisma.score.update({
                    where: { id: existing.id },
                    data: {
                        firstCA: entry.firstCA,
                        secondCA: entry.secondCA,
                        exam: entry.exam,
                        total,
                        grade,
                        remark: entry.remark || "",
                        enteredByTeacherId: teacherId || null,
                    },
                });
            }
            else {
                scoreRecord = await db_1.prisma.score.create({
                    data: {
                        schoolId,
                        studentId: entry.studentId,
                        subjectId: request.subjectId,
                        classId: request.classId,
                        termId: request.termId,
                        academicSessionId: request.academicSessionId,
                        firstCA: entry.firstCA,
                        secondCA: entry.secondCA,
                        exam: entry.exam,
                        total,
                        grade,
                        remark: entry.remark || "",
                        enteredByTeacherId: teacherId || null,
                    },
                });
            }
            responses.push(this.mapToResponse(scoreRecord, student, subject.name));
        }
        return (0, response_1.successResponse)(responses, `${responses.length} scores entered successfully.`);
    }
    static async getClassScoreSheet(schoolId, classId, subjectId, termId) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        const subject = await db_1.prisma.subject.findFirst({
            where: { id: subjectId, schoolId },
        });
        if (!subject) {
            return (0, response_1.failResponse)("Subject not found.");
        }
        const term = await db_1.prisma.term.findFirst({
            where: { id: termId },
            include: { academicSession: true },
        });
        if (!term) {
            return (0, response_1.failResponse)("Term not found.");
        }
        const scores = await db_1.prisma.score.findMany({
            where: {
                schoolId,
                classId,
                subjectId,
                termId,
            },
            include: {
                student: true,
            },
            orderBy: {
                student: {
                    fullName: "asc",
                },
            },
        });
        const scoresMapped = scores.map((s) => ({
            id: s.id,
            studentId: s.studentId,
            studentName: s.student.fullName,
            admissionNumber: s.student.admissionNumber,
            subjectId: s.subjectId,
            subjectName: subject.name,
            firstCA: Number(s.firstCA),
            secondCA: Number(s.secondCA),
            exam: Number(s.exam),
            total: Number(s.total),
            grade: s.grade,
            remark: s.remark,
        }));
        return (0, response_1.successResponse)({
            classId: classEntity.id,
            className: `${classEntity.name} ${classEntity.arm}`.trim(),
            subjectId: subject.id,
            subjectName: subject.name,
            termName: term.termNumber,
            sessionName: term.academicSession.name,
            scores: scoresMapped,
        }, "Score sheet retrieved.");
    }
    static async getStudentScores(schoolId, studentId, termId) {
        const student = await db_1.prisma.student.findFirst({
            where: { id: studentId, schoolId },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student not found.");
        }
        const scores = await db_1.prisma.score.findMany({
            where: {
                schoolId,
                studentId,
                termId,
            },
            include: {
                subject: true,
            },
            orderBy: {
                subject: {
                    name: "asc",
                },
            },
        });
        const response = scores.map((s) => ({
            id: s.id,
            studentId: s.studentId,
            studentName: student.fullName,
            admissionNumber: student.admissionNumber,
            subjectId: s.subjectId,
            subjectName: s.subject.name,
            firstCA: Number(s.firstCA),
            secondCA: Number(s.secondCA),
            exam: Number(s.exam),
            total: Number(s.total),
            grade: s.grade,
            remark: s.remark,
        }));
        return (0, response_1.successResponse)(response, "Student scores retrieved.");
    }
}
exports.ScoreService = ScoreService;
