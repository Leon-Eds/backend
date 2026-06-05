"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async createSuperAdmin(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.createSuperAdmin(req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.registerSchool(req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(401).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.refreshToken(req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(401).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized context" });
            }
            const result = await auth_service_1.AuthService.changePassword(userId, req.body);
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
exports.AuthController = AuthController;
