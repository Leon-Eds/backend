"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingController = void 0;
const grading_service_1 = require("../services/grading.service");
class GradingController {
    static async setGradingRules(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await grading_service_1.GradingService.setGradingRules(schoolId, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getGradingRules(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await grading_service_1.GradingService.getGradingRules(schoolId);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GradingController = GradingController;
