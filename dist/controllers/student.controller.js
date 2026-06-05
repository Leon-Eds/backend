"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const student_service_1 = require("../services/student.service");
class StudentController {
    static async getAll(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await student_service_1.StudentService.getStudents(schoolId, req.query);
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
            const result = await student_service_1.StudentService.getStudentById(schoolId, id);
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
            const result = await student_service_1.StudentService.createStudent(schoolId, req.body);
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
            const result = await student_service_1.StudentService.updateStudent(schoolId, id, req.body);
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
            const result = await student_service_1.StudentService.deleteStudent(schoolId, id);
            if (result.success) {
                return res.status(200).json(result);
            }
            return res.status(400).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async search(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const q = String(req.query.q || "");
            const result = await student_service_1.StudentService.searchStudents(schoolId, q);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StudentController = StudentController;
