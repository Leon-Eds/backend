"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolController = void 0;
const school_service_1 = require("../services/school.service");
const response_1 = require("../utils/response");
class SchoolController {
    static async getAll(req, res, next) {
        try {
            const result = await school_service_1.SchoolService.getAllSchools(req.query);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            if (req.user?.role !== "SuperAdmin" && req.user?.schoolId !== id) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            const result = await school_service_1.SchoolService.getSchoolById(id);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(404).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            if (req.user?.role !== "SuperAdmin" && req.user?.schoolId !== id) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            const result = await school_service_1.SchoolService.updateSchool(id, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePlan(req, res, next) {
        try {
            const { id } = req.params;
            const { subscriptionPlan } = req.body;
            const result = await school_service_1.SchoolService.updateSchoolPlan(id, subscriptionPlan);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const isActive = req.query.isActive === "true";
            const result = await school_service_1.SchoolService.updateSchoolStatus(id, isActive);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getPlans(req, res, next) {
        try {
            const plans = await school_service_1.SchoolService.getSubscriptionPlans();
            return res.status(200).json((0, response_1.successResponse)(plans));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SchoolController = SchoolController;
