import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AnnouncementService } from "../services/announcement.service";

export class AnnouncementController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School context required." });
      }
      const result = await AnnouncementService.getAnnouncements(schoolId, req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School context required." });
      }
      const result = await AnnouncementService.getAnnouncementById(schoolId, req.params.id);
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
      const schoolId = req.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        return res.status(400).json({ success: false, message: "School and user context required." });
      }
      const result = await AnnouncementService.createAnnouncement(schoolId, userId, req.body);
      if (result.success) {
        return res.status(201).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School context required." });
      }
      const result = await AnnouncementService.deleteAnnouncement(schoolId, req.params.id);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(404).json(result);
    } catch (error) {
      next(error);
    }
  }
}
