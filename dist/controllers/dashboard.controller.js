"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
class DashboardController {
    static async getSchoolDashboard(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await dashboard_service_1.DashboardService.getSchoolDashboard(schoolId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSuperAdminDashboard(req, res, next) {
        try {
            const result = await dashboard_service_1.DashboardService.getSuperAdminDashboard();
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getTeacherDashboard(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const result = await dashboard_service_1.DashboardService.getTeacherDashboard(schoolId, userId);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStudentDashboard(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id;
            const result = await dashboard_service_1.DashboardService.getStudentDashboard(schoolId, userId);
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
exports.DashboardController = DashboardController;
