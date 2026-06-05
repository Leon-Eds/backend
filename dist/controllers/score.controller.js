"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreController = void 0;
const score_service_1 = require("../services/score.service");
const db_1 = require("../config/db");
class ScoreController {
    static async getTeacherId(userId) {
        const teacher = await db_1.prisma.teacher.findFirst({
            where: { userId },
        });
        return teacher ? teacher.id : null;
    }
    static async enterScore(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const teacherId = await ScoreController.getTeacherId(userId);
            const result = await score_service_1.ScoreService.enterScore(schoolId, teacherId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async bulkEnterScores(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const teacherId = await ScoreController.getTeacherId(userId);
            const result = await score_service_1.ScoreService.bulkEnterScores(schoolId, teacherId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getClassScoreSheet(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, subjectId, termId } = req.params;
            const result = await score_service_1.ScoreService.getClassScoreSheet(schoolId, classId, subjectId, termId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStudentScores(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, termId } = req.params;
            const result = await score_service_1.ScoreService.getStudentScores(schoolId, studentId, termId);
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
exports.ScoreController = ScoreController;
