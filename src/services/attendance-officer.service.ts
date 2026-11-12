import { prisma } from "../config/db";
import { hashPassword } from "../utils/bcrypt";
import { successResponse, failResponse } from "../utils/response";
import { emailService } from "../utils/email";

/**
 * Attendance officers are support staff accounts that can scan any student's ID card
 * to record attendance, without being the student's form teacher.
 */
export class AttendanceOfficerService {
  private static mapToResponse(u: any) {
    return {
      id: u.id,
      fullName: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  }

  static async createOfficer(schoolId: string, request: any) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return failResponse("School not found.");

    const email = request.email.toLowerCase();
    const emailInUse = await prisma.user.findUnique({ where: { email } });
    if (emailInUse) return failResponse("Email already in use.");

    const user = await prisma.user.create({
      data: {
        schoolId,
        name: request.fullName,
        email,
        passwordHash: await hashPassword(request.password),
        role: "AttendanceOfficer",
        isActive: true,
        isVerified: true,
      },
    });

    // Wait for the delivery attempt so serverless runtimes do not terminate it early.
    await emailService.sendAttendanceOfficerWelcomeEmail(
      user.email,
      user.name,
      school.name,
      user.email,
      request.password
    ).catch((err) => console.error("[AttendanceOfficerService] Onboarding email error:", err));

    return successResponse(this.mapToResponse(user), "Attendance officer created successfully.");
  }

  static async getOfficers(schoolId: string) {
    const officers = await prisma.user.findMany({
      where: { schoolId, role: "AttendanceOfficer" },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(officers.map((u) => this.mapToResponse(u)), "Attendance officers retrieved.");
  }

  static async deleteOfficer(schoolId: string, id: string) {
    const user = await prisma.user.findFirst({ where: { id, schoolId, role: "AttendanceOfficer" } });
    if (!user) return failResponse("Attendance officer not found.");

    // Attendance they recorded keeps the record; takenByUserId is cleared by the relation
    await prisma.user.delete({ where: { id } });
    return successResponse(true, "Attendance officer removed successfully.");
  }
}
