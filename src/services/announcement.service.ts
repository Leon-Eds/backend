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
      createdByUserId: a.createdByUserId,
      createdByName: a.createdByUser?.name || null,
      createdAt: a.createdAt,
    };
  }

  static async getAnnouncements(schoolId: string, params: any) {
    const isAll = params.all === "true" || params.pageSize === "0" || params.pageSize === 0;

    const where: any = { schoolId };
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
      },
      include: {
        createdByUser: { select: { name: true } },
      },
    });

    const responseData = this.mapToResponse(announcement);
    NotificationService.sendToSchool(schoolId, "announcement_created", responseData);

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
