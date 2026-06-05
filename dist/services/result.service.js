"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
const fee_service_1 = require("./fee.service");
class ResultService {
    static async computeClassResults(schoolId, classId, termId) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        const term = await db_1.prisma.term.findFirst({
            where: { id: termId },
            include: { academicSession: true },
        });
        if (!term) {
            return (0, response_1.failResponse)("Term not found.");
        }
        const students = await db_1.prisma.student.findMany({
            where: { schoolId, classId, status: "Active" },
        });
        if (students.length === 0) {
            return (0, response_1.failResponse)("No active students in this class.");
        }
        const allScores = await db_1.prisma.score.findMany({
            where: { schoolId, classId, termId },
        });
        const studentResults = [];
        for (const student of students) {
            const studentScores = allScores.filter((s) => s.studentId === student.id);
            if (studentScores.length === 0)
                continue;
            const totalScore = studentScores.reduce((sum, s) => sum + Number(s.total), 0);
            const average = Math.round((totalScore / studentScores.length) * 100) / 100;
            studentResults.push({
                studentId: student.id,
                totalScore,
                average,
                subjectCount: studentScores.length,
            });
        }
        // Sort by average descending
        const ranked = [...studentResults].sort((a, b) => b.average - a.average);
        let position = 0;
        let lastAverage = -1;
        for (let i = 0; i < ranked.length; i++) {
            if (ranked[i].average !== lastAverage) {
                position = i + 1;
                lastAverage = ranked[i].average;
            }
            const studentData = ranked[i];
            const existingResult = await db_1.prisma.result.findFirst({
                where: {
                    schoolId,
                    studentId: studentData.studentId,
                    termId,
                },
            });
            if (existingResult) {
                await db_1.prisma.result.update({
                    where: { id: existingResult.id },
                    data: {
                        totalScore: studentData.totalScore,
                        average: studentData.average,
                        position,
                        subjectCount: studentData.subjectCount,
                        status: "Draft",
                    },
                });
            }
            else {
                await db_1.prisma.result.create({
                    data: {
                        schoolId,
                        studentId: studentData.studentId,
                        classId,
                        termId,
                        academicSessionId: term.academicSessionId,
                        totalScore: studentData.totalScore,
                        average: studentData.average,
                        position,
                        subjectCount: studentData.subjectCount,
                        status: "Draft",
                    },
                });
            }
        }
        return this.getClassResults(schoolId, classId, termId);
    }
    static async submitResults(schoolId, classId, termId, request) {
        const results = await db_1.prisma.result.findMany({
            where: { schoolId, classId, termId },
        });
        if (results.length === 0) {
            return (0, response_1.failResponse)("No results found. Please compute results first.");
        }
        await db_1.prisma.result.updateMany({
            where: {
                schoolId,
                classId,
                termId,
                status: "Draft",
            },
            data: {
                status: "Submitted",
                teacherComment: request.teacherComment || "",
                submittedAt: new Date(),
            },
        });
        return (0, response_1.successResponse)(true, "Results submitted for approval.");
    }
    static async approveResults(schoolId, classId, termId, request) {
        const results = await db_1.prisma.result.findMany({
            where: { schoolId, classId, termId, status: "Submitted" },
        });
        if (results.length === 0) {
            return (0, response_1.failResponse)("No submitted results found for approval.");
        }
        if (request.approve) {
            await db_1.prisma.result.updateMany({
                where: {
                    schoolId,
                    classId,
                    termId,
                    status: "Submitted",
                },
                data: {
                    status: "Approved",
                    adminComment: request.adminComment || "",
                    approvedAt: new Date(),
                },
            });
        }
        else {
            await db_1.prisma.result.updateMany({
                where: {
                    schoolId,
                    classId,
                    termId,
                    status: "Submitted",
                },
                data: {
                    status: "Draft",
                    adminComment: request.adminComment || "",
                },
            });
        }
        return (0, response_1.successResponse)(true, request.approve ? "Results approved." : "Results rejected and sent back to draft.");
    }
    static async publishResults(schoolId, classId, termId) {
        const results = await db_1.prisma.result.findMany({
            where: { schoolId, classId, termId, status: "Approved" },
        });
        if (results.length === 0) {
            return (0, response_1.failResponse)("No approved results found to publish.");
        }
        await db_1.prisma.result.updateMany({
            where: {
                schoolId,
                classId,
                termId,
                status: "Approved",
            },
            data: {
                status: "Published",
                publishedAt: new Date(),
            },
        });
        return (0, response_1.successResponse)(true, "Results published. Students can now view their results.");
    }
    static async getClassResults(schoolId, classId, termId) {
        const classEntity = await db_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
        });
        if (!classEntity) {
            return (0, response_1.failResponse)("Class not found.");
        }
        const term = await db_1.prisma.term.findFirst({
            where: { id: termId },
            include: { academicSession: true },
        });
        if (!term) {
            return (0, response_1.failResponse)("Term not found.");
        }
        const results = await db_1.prisma.result.findMany({
            where: { schoolId, classId, termId },
            include: { student: true },
            orderBy: { position: "asc" },
        });
        const statusGroup = results[0]?.status || "N/A";
        const totalAverageSum = results.reduce((sum, r) => sum + Number(r.average), 0);
        const classAverage = results.length > 0 ? Math.round((totalAverageSum / results.length) * 100) / 100 : 0;
        const studentsMapped = results.map((r) => ({
            studentId: r.studentId,
            studentName: r.student.fullName,
            admissionNumber: r.student.admissionNumber,
            totalScore: Number(r.totalScore),
            average: Number(r.average),
            position: r.position,
            subjectCount: r.subjectCount,
            status: r.status,
        }));
        return (0, response_1.successResponse)({
            classId: classEntity.id,
            className: `${classEntity.name} ${classEntity.arm}`.trim(),
            termName: term.termNumber,
            sessionName: term.academicSession.name,
            status: statusGroup,
            totalStudents: results.length,
            classAverage,
            students: studentsMapped,
        }, "Class results retrieved.");
    }
    static async getStudentResult(schoolId, studentId, termId) {
        const result = await db_1.prisma.result.findFirst({
            where: { schoolId, studentId, termId },
            include: {
                student: true,
                class: true,
                term: {
                    include: { academicSession: true },
                },
            },
        });
        if (!result) {
            return (0, response_1.failResponse)("Result not found.");
        }
        const totalInClass = await db_1.prisma.result.count({
            where: { schoolId, classId: result.classId, termId },
        });
        const scores = await db_1.prisma.score.findMany({
            where: { schoolId, studentId, termId },
            include: { subject: true },
            orderBy: {
                subject: {
                    name: "asc",
                },
            },
        });
        const subjectScoresMapped = scores.map((s) => ({
            id: s.id,
            studentId: s.studentId,
            studentName: result.student.fullName,
            admissionNumber: result.student.admissionNumber,
            subjectId: s.subjectId,
            subjectName: s.subject.name,
            firstCA: Number(s.firstCA),
            secondCA: Number(s.secondCA),
            exam: Number(s.exam),
            total: Number(s.total),
            grade: s.grade,
            remark: s.remark,
        }));
        return (0, response_1.successResponse)({
            resultId: result.id,
            studentId: result.studentId,
            studentName: result.student.fullName,
            admissionNumber: result.student.admissionNumber,
            className: result.class ? `${result.class.name} ${result.class.arm}`.trim() : "",
            termName: result.term.termNumber,
            sessionName: result.term.academicSession.name,
            totalScore: Number(result.totalScore),
            average: Number(result.average),
            position: result.position,
            subjectCount: result.subjectCount,
            totalStudentsInClass: totalInClass,
            status: result.status,
            teacherComment: result.teacherComment,
            adminComment: result.adminComment,
            subjectScores: subjectScoresMapped,
        }, "Student result retrieved.");
    }
    static async checkMyResult(schoolId, userId, termId) {
        const student = await db_1.prisma.student.findFirst({
            where: { schoolId, userId },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student profile not found.");
        }
        const result = await db_1.prisma.result.findFirst({
            where: { schoolId, studentId: student.id, termId },
        });
        if (!result || result.status !== "Published") {
            return (0, response_1.successResponse)({
                isFeesCleared: false,
                message: "Results have not been published yet for this term.",
                result: null,
            }, "Results not yet available.");
        }
        const isCleared = await fee_service_1.FeeService.isStudentCleared(schoolId, student.id, termId);
        if (!isCleared) {
            return (0, response_1.successResponse)({
                isFeesCleared: false,
                message: "Your fees have not been cleared for this term. Please contact the school administration.",
                result: null,
            }, "Fee clearance required.");
        }
        const fullResult = await this.getStudentResult(schoolId, student.id, termId);
        return (0, response_1.successResponse)({
            isFeesCleared: true,
            message: "Result retrieved successfully.",
            result: fullResult.data,
        }, "Result retrieved.");
    }
}
exports.ResultService = ResultService;
