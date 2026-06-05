"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherController = void 0;
const teacher_service_1 = require("../services/teacher.service");
class TeacherController {
    static async getAll(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await teacher_service_1.TeacherService.getTeachers(schoolId, req.query);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await teacher_service_1.TeacherService.getTeacherById(schoolId, id);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(404).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await teacher_service_1.TeacherService.createTeacher(schoolId, req.body);
            if (result.success) {
                return res.status(201).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await teacher_service_1.TeacherService.updateTeacher(schoolId, id, req.body);
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
            const schoolId = req.schoolId;
            const { id } = req.params;
            const isActive = req.query.isActive === "true";
            const result = await teacher_service_1.TeacherService.updateTeacherStatus(schoolId, id, isActive);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async assign(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await teacher_service_1.TeacherService.assignTeacher(schoolId, id, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async removeAssignment(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { assignmentId } = req.params;
            const result = await teacher_service_1.TeacherService.removeAssignment(schoolId, assignmentId);
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
exports.TeacherController = TeacherController;
