"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeService = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
class FeeService {
    static mapToResponse(fee, student) {
        const amountDue = Number(fee.amountDue);
        const amountPaid = Number(fee.amountPaid);
        const balance = amountDue - amountPaid;
        return {
            id: fee.id,
            studentId: fee.studentId,
            studentName: student.fullName,
            admissionNumber: student.admissionNumber,
            amountDue,
            amountPaid,
            balance,
            status: fee.status,
            isCleared: fee.status === "Cleared",
            clearedAt: fee.clearedAt,
        };
    }
    static async recordPayment(schoolId, request) {
        const student = await db_1.prisma.student.findFirst({
            where: { id: request.studentId, schoolId },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student not found in this school.");
        }
        const existing = await db_1.prisma.feePayment.findFirst({
            where: {
                schoolId,
                studentId: request.studentId,
                termId: request.termId,
            },
        });
        const status = request.amountPaid >= request.amountDue ? "Cleared" : "Pending";
        let feeRecord;
        if (existing) {
            feeRecord = await db_1.prisma.feePayment.update({
                where: { id: existing.id },
                data: {
                    amountDue: request.amountDue,
                    amountPaid: request.amountPaid,
                    status,
                    clearedAt: status === "Cleared" ? (existing.clearedAt ? existing.clearedAt : new Date()) : null,
                },
            });
        }
        else {
            feeRecord = await db_1.prisma.feePayment.create({
                data: {
                    schoolId,
                    studentId: request.studentId,
                    termId: request.termId,
                    academicSessionId: request.academicSessionId,
                    amountDue: request.amountDue,
                    amountPaid: request.amountPaid,
                    status,
                    clearedAt: status === "Cleared" ? new Date() : null,
                },
            });
        }
        return (0, response_1.successResponse)(this.mapToResponse(feeRecord, student), "Fee payment recorded.");
    }
    static async getStudentFeeStatus(schoolId, studentId, termId) {
        const student = await db_1.prisma.student.findFirst({
            where: { id: studentId, schoolId },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student not found.");
        }
        const fee = await db_1.prisma.feePayment.findFirst({
            where: { schoolId, studentId, termId },
        });
        if (!fee) {
            return (0, response_1.successResponse)({
                studentId,
                studentName: student.fullName,
                admissionNumber: student.admissionNumber,
                amountDue: 0,
                amountPaid: 0,
                balance: 0,
                status: "NotRecorded",
                isCleared: false,
            }, "No fee record found for this term.");
        }
        return (0, response_1.successResponse)(this.mapToResponse(fee, student), "Fee status retrieved.");
    }
    static async getClassFeeOverview(schoolId, classId, termId) {
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
        const fees = await db_1.prisma.feePayment.findMany({
            where: { schoolId, termId },
        });
        const studentFees = students.map((student) => {
            const fee = fees.find((f) => f.studentId === student.id);
            if (fee) {
                return this.mapToResponse(fee, student);
            }
            return {
                id: "00000000-0000-0000-0000-000000000000",
                studentId: student.id,
                studentName: student.fullName,
                admissionNumber: student.admissionNumber,
                amountDue: 0,
                amountPaid: 0,
                balance: 0,
                status: "NotRecorded",
                isCleared: false,
                clearedAt: null,
            };
        });
        const totalStudents = studentFees.length;
        const clearedCount = studentFees.filter((f) => f.isCleared).length;
        const pendingCount = totalStudents - clearedCount;
        const totalAmountDue = studentFees.reduce((sum, f) => sum + f.amountDue, 0);
        const totalAmountPaid = studentFees.reduce((sum, f) => sum + f.amountPaid, 0);
        return (0, response_1.successResponse)({
            classId: classEntity.id,
            className: `${classEntity.name} ${classEntity.arm}`.trim(),
            termName: term.termNumber,
            totalStudents,
            clearedCount,
            pendingCount,
            totalAmountDue,
            totalAmountPaid,
            students: studentFees,
        }, "Class fee overview retrieved.");
    }
    static async clearStudent(schoolId, studentId, termId, clearedByUserId) {
        const student = await db_1.prisma.student.findFirst({
            where: { id: studentId, schoolId },
        });
        if (!student) {
            return (0, response_1.failResponse)("Student not found.");
        }
        const fee = await db_1.prisma.feePayment.findFirst({
            where: { schoolId, studentId, termId },
        });
        let feeRecord;
        if (!fee) {
            const term = await db_1.prisma.term.findFirst({
                where: { id: termId },
            });
            if (!term) {
                return (0, response_1.failResponse)("Term not found.");
            }
            feeRecord = await db_1.prisma.feePayment.create({
                data: {
                    schoolId,
                    studentId,
                    termId,
                    academicSessionId: term.academicSessionId,
                    amountDue: 0,
                    amountPaid: 0,
                    status: "Cleared",
                    clearedByUserId,
                    clearedAt: new Date(),
                },
            });
        }
        else {
            feeRecord = await db_1.prisma.feePayment.update({
                where: { id: fee.id },
                data: {
                    status: "Cleared",
                    clearedByUserId,
                    clearedAt: new Date(),
                },
            });
        }
        return (0, response_1.successResponse)(this.mapToResponse(feeRecord, student), "Student fee cleared.");
    }
    static async isStudentCleared(schoolId, studentId, termId) {
        const fee = await db_1.prisma.feePayment.findFirst({
            where: { schoolId, studentId, termId },
        });
        return fee?.status === "Cleared";
    }
}
exports.FeeService = FeeService;
