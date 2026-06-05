"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicSessionController = void 0;
const session_service_1 = require("../services/session.service");
class AcademicSessionController {
    static async getAll(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await session_service_1.AcademicSessionService.getSessions(schoolId);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async createSession(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await session_service_1.AcademicSessionService.createSession(schoolId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async setCurrentSession(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await session_service_1.AcademicSessionService.setCurrentSession(schoolId, id);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async createTerm(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await session_service_1.AcademicSessionService.createTerm(schoolId, id, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async setCurrentTerm(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { termId } = req.params;
            const result = await session_service_1.AcademicSessionService.setCurrentTerm(schoolId, termId);
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
exports.AcademicSessionController = AcademicSessionController;
