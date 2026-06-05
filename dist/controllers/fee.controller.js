"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeController = void 0;
const fee_service_1 = require("../services/fee.service");
class FeeController {
    static async recordPayment(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await fee_service_1.FeeService.recordPayment(schoolId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async clearStudent(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const { studentId, termId } = req.params;
            const result = await fee_service_1.FeeService.clearStudent(schoolId, studentId, termId, userId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStudentFeeStatus(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, termId } = req.params;
            const result = await fee_service_1.FeeService.getStudentFeeStatus(schoolId, studentId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getClassFeeOverview(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, termId } = req.params;
            const result = await fee_service_1.FeeService.getClassFeeOverview(schoolId, classId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FeeController = FeeController;
