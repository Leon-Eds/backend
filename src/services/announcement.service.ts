import { prisma } from "../config/db";
import { successResponse, failResponse, createPagedResult } from "../utils/response";
import { NotificationService } from "./notification.service";

export class AnnouncementService {
  private static mapToResponse(a: any) {
    return {
      id: a.id,
      title: a.title,
      content: a.content,
      audience: a.audience,
      category: a.category || "GENERAL",
      targetClassId: a.targetClassId || null,
      targetUserId: a.targetUserId || null,
      createdByUserId: a.createdByUserId,
      createdByName: a.createdByUser?.name || null,
      createdAt: a.createdAt,
    };
  }

  static async getAnnouncements(schoolId: string, params: any, userId?: string, userRole?: string) {
    const isAll = params.all === "true" || params.pageSize === "0" || params.pageSize === 0;

    const where: any = { schoolId };

    // Apply role-based scoping
    if (userRole === "Student") {
      const student = await prisma.student.findFirst({
        where: { userId, schoolId },
        select: { classId: true }
      });
      where.OR = [
        { audience: "All" },
        { audience: "Students" },
        ...(student?.classId ? [{ audience: "Class", targetClassId: student.classId }] : []),
        { audience: "SpecificUser", targetUserId: userId }
      ];
    } else if (userRole === "Teacher") {
      where.OR = [
        { audience: "All" },
        { audience: "Teachers" },
        { audience: "SpecificUser", targetUserId: userId }
      ];
    } else if (userRole === "Bursar") {
      where.OR = [
        { audience: "All" },
        { audience: "SpecificUser", targetUserId: userId }
      ];
    }

    if (params.audience) {
      where.audience = params.audience;
    }
    if (params.category) {
      where.category = params.category;
    }

    const totalCount = await prisma.announcement.count({ where });

    const pageNumber = isAll ? 1 : parseInt(params.pageNumber || "1", 10);
    const pageSize = isAll ? (totalCount || 1) : parseInt(params.pageSize || "20", 10);

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(isAll ? {} : {
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      include: {
        createdByUser: { select: { name: true } },
      },
    });

    const items = announcements.map((a) => this.mapToResponse(a));
    const pagedResult = createPagedResult(items, totalCount, pageNumber, pageSize);

    return successResponse(pagedResult);
  }

  static async getAnnouncementById(schoolId: string, announcementId: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id: announcementId, schoolId },
      include: {
        createdByUser: { select: { name: true } },
      },
    });

    if (!announcement) {
      return failResponse("Announcement not found.");
    }

    return successResponse(this.mapToResponse(announcement));
  }

  static async createAnnouncement(schoolId: string, userId: string, request: any) {
    // If audience is "Class", require targetClassId
    if (request.audience === "Class" && !request.targetClassId) {
      return failResponse("Target class is required when audience is 'Class'.");
    }

    // If audience is "SpecificUser", require targetUserId
    if (request.audience === "SpecificUser") {
      if (!request.targetUserId) {
        return failResponse("Target user is required when audience is 'SpecificUser'.");
      }
      const targetUserExists = await prisma.user.findFirst({
        where: { id: request.targetUserId, schoolId },
      });
      if (!targetUserExists) {
        return failResponse("Target user not found in this school.");
      }
    }

    // Validate targetClassId exists if provided
    if (request.targetClassId) {
      const classExists = await prisma.class.findFirst({
        where: { id: request.targetClassId, schoolId },
      });
      if (!classExists) {
        return failResponse("Target class not found.");
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId,
        createdByUserId: userId,
        title: request.title,
        content: request.content,
        audience: request.audience || "All",
        category: request.category || "GENERAL",
        targetClassId: request.targetClassId || null,
        targetUserId: request.targetUserId || null,
      },
      include: {
        createdByUser: { select: { name: true } },
      },
    });

    const responseData = this.mapToResponse(announcement);
    
    // Broadcast notifications
    if (announcement.audience === "SpecificUser" && announcement.targetUserId) {
      NotificationService.sendToUser(announcement.targetUserId, "announcement_created", responseData);
    } else {
      NotificationService.sendToSchool(schoolId, "announcement_created", responseData);
    }

    return successResponse(responseData, "Announcement created successfully.");
  }

  static async deleteAnnouncement(schoolId: string, announcementId: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id: announcementId, schoolId },
    });

    if (!announcement) {
      return failResponse("Announcement not found.");
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    return successResponse(true, "Announcement deleted successfully.");
  }
}

