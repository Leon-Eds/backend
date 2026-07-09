import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { StudentService } from "../services/student.service";
import { StudentCardService } from "../services/student-card.service";
import { prisma } from "../config/db";


export class StudentController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await StudentService.getStudents(schoolId, req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await StudentService.getStudentById(schoolId, id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(404).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await StudentService.createStudent(schoolId, req.body);
      if (result.success) {
        return res.status(201).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await StudentService.updateStudent(schoolId, id, req.body);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await StudentService.deleteStudent(schoolId, id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const q = String(req.query.q || "");
      const result = await StudentService.searchStudents(schoolId, q);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
      }
      const result = await StudentService.resetStudentPassword(schoolId, id, newPassword.trim());
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async downloadMyIdCardPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User context missing." });
      }

      const student = await prisma.student.findFirst({
        where: { userId, schoolId }
      });

      if (!student) {
        return res.status(404).json({ success: false, message: "Student profile not found." });
      }

      const result = await StudentCardService.generateStudentIdCardPdf(schoolId, student.id);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=idcard-${student.admissionNumber || student.id}.pdf`);
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  static async downloadStudentIdCardPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;

      const student = await prisma.student.findFirst({
        where: { id, schoolId }
      });

      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found." });
      }

      const result = await StudentCardService.generateStudentIdCardPdf(schoolId, id);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=idcard-${student.admissionNumber || student.id}.pdf`);
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  }
}

