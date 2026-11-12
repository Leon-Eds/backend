import QRCode from "qrcode";
import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { PdfGenerator } from "../utils/pdf-generator";
import { nextStaffNumber } from "./teacher.service";

export class StaffCardService {
  /**
   * Generates a staff ID card PDF for a teacher using the shared ID card template.
   * The back carries the same "if found, return to the school" contact as student cards.
   */
  static async generateStaffIdCardPdf(schoolId: string, teacherId: string): Promise<any> {
    let teacher = await prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
    if (!teacher) return failResponse("Teacher not found.");

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return failResponse("School not found.");

    // Teachers created before staff numbers existed get one the first time a card is made
    if (!teacher.staffNumber) {
      teacher = await prisma.teacher.update({
        where: { id: teacher.id },
        data: { staffNumber: await nextStaffNumber(schoolId) },
      });
    }

    const issueDate = new Date(teacher.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    let qrCodeImage: string | null = null;
    try {
      qrCodeImage = await QRCode.toDataURL(JSON.stringify({
        type: "staff",
        schoolName: school.name,
        staffName: teacher.fullName,
        staffNumber: teacher.staffNumber,
      }), { margin: 1, width: 200, color: { dark: "#1e293b", light: "#ffffff" } });
    } catch (err) {
      console.error("[StaffCardService] QR Code generation failed:", err);
    }

    const theme = (school.schoolTheme as any) || {};
    const templateData = {
      schoolName: school.name,
      schoolLogo: school.logoUrl || null,
      schoolWebsite: school.website || "www.leoned.ng",
      schoolInitial: school.name ? school.name.charAt(0).toUpperCase() : "S",
      themeColor: theme.primaryColor || "#053d26",
      accentColor: theme.accentColor || "#b45309",
      holderName: teacher.fullName,
      holderPhoto: teacher.profilePictureUrl || null,
      cardLabel: "STAFF",
      idLabel: "STAFF ID",
      idNumber: teacher.staffNumber,
      detailLabel: "ROLE",
      detailValue: "Teacher",
      issueDate,
      returnContactName: school.name,
      returnContactPhone: school.contactPhone || "N/A",
      returnContactRelation: "School Admin",
      qrCodeImage,
    };

    const pdfBuffer = await PdfGenerator.renderTemplateToPdf("id_card", templateData, { printBackground: true });
    return successResponse({ pdfBuffer, staffNumber: teacher.staffNumber }, "Staff ID card PDF generated successfully.");
  }
}
