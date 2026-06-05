"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassController = void 0;
const class_service_1 = require("../services/class.service");
class ClassController {
    static async getAll(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await class_service_1.ClassService.getClasses(schoolId);
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
            const result = await class_service_1.ClassService.getClassById(schoolId, id);
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
            const result = await class_service_1.ClassService.createClass(schoolId, req.body);
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
            const result = await class_service_1.ClassService.updateClass(schoolId, id, req.body);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await class_service_1.ClassService.deleteClass(schoolId, id);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async assignSubjects(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await class_service_1.ClassService.assignSubjectsToClass(schoolId, id, req.body);
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
exports.ClassController = ClassController;
