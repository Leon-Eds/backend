"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectController = void 0;
const subject_service_1 = require("../services/subject.service");
class SubjectController {
    static async getAll(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await subject_service_1.SubjectService.getSubjects(schoolId);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await subject_service_1.SubjectService.createSubject(schoolId, req.body);
            if (result.success) {
                return res.status(200).json(result);
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
            const result = await subject_service_1.SubjectService.updateSubject(schoolId, id, req.body);
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
            const result = await subject_service_1.SubjectService.deleteSubject(schoolId, id);
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
exports.SubjectController = SubjectController;
