"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultController = void 0;
const result_service_1 = require("../services/result.service");
class ResultController {
    static async computeClassResults(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, termId } = req.params;
            const result = await result_service_1.ResultService.computeClassResults(schoolId, classId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async submitResults(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, termId } = req.params;
            const result = await result_service_1.ResultService.submitResults(schoolId, classId, termId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async approveResults(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, termId } = req.params;
            const result = await result_service_1.ResultService.approveResults(schoolId, classId, termId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async publishResults(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, termId } = req.params;
            const result = await result_service_1.ResultService.publishResults(schoolId, classId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getClassResults(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, termId } = req.params;
            const result = await result_service_1.ResultService.getClassResults(schoolId, classId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStudentResult(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, termId } = req.params;
            const result = await result_service_1.ResultService.getStudentResult(schoolId, studentId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async checkMyResult(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const { termId } = req.params;
            const result = await result_service_1.ResultService.checkMyResult(schoolId, userId, termId);
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
exports.ResultController = ResultController;
