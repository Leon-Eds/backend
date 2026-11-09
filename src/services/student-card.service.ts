import QRCode from "qrcode";
import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { PdfGenerator } from "../utils/pdf-generator";

export class StudentCardService {
  /**
   * Returns student ID card data as a JSON payload containing:
   * school name, school logo URL, student name, admission number,
   * class, issue date (enrolled date), a "return to" contact (the school
   * and its admin phone; parent details are left off for privacy), and a
   * QR code (base64 data URI).
   */
  static async getStudentIdCardData(schoolId: string, studentId: string): Promise<any> {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        class: true,
      },
    });

    if (!student) {
      return failResponse("Student not found.");
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    // Build class name
    const className = student.class
      ? `${student.class.name} ${student.arm || ""}`.trim()
      : "N/A";

    // Format enrollment date as Issue Date
    const issueDateStr = student.enrolledAt
      ? new Date(student.enrolledAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    // Generate QR code as base64 data URI
    const qrData = JSON.stringify({
      schoolName: school.name,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
    });

    let qrCodeDataUri: string | null = null;
    try {
      qrCodeDataUri = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 200,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      });
    } catch (err) {
      console.error("[StudentCardService] QR Code generation failed:", err);
    }

    const theme = (school.schoolTheme as any) || {};

    const cardData = {
      school: {
        id: school.id,
        name: school.name,
        logo: school.logoUrl || null,
        website: school.website || "",
        schoolTheme: theme,
      },
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        className: className,
        bloodGroup: student.bloodGroup || null,
        passportUrl: student.profilePictureUrl || null,
        issueDate: issueDateStr,
      },
      returnContact: {
        name: school.name,
        phone: school.contactPhone || "N/A",
        relationship: "School Admin",
      },
      qrCode: qrCodeDataUri,
    };

    return successResponse(cardData, "Student ID card data retrieved successfully.");
  }

  /**
   * Generates a high-quality PDF for a student's ID card using the HTML/Tailwind template.
   */
  static async generateStudentIdCardPdf(schoolId: string, studentId: string): Promise<any> {
    const dataResult = await this.getStudentIdCardData(schoolId, studentId);
    if (!dataResult.success || !dataResult.data) {
      return failResponse(dataResult.message);
    }

    const cardData = dataResult.data;
    const templateData = {
      schoolName: cardData.school.name,
      schoolLogo: cardData.school.logo,
      schoolWebsite: cardData.school.website || "www.leoned.ng",
      schoolInitial: cardData.school.name ? cardData.school.name.charAt(0).toUpperCase() : "S",
      themeColor: cardData.school.schoolTheme?.primaryColor || "#053d26",
      accentColor: cardData.school.schoolTheme?.accentColor || "#b45309",
      studentName: cardData.student.fullName,
      studentPassport: cardData.student.passportUrl,
      admissionNumber: cardData.student.admissionNumber,
      className: cardData.student.className,
      issueDate: cardData.student.issueDate,
      returnContactName: cardData.returnContact.name,
      returnContactPhone: cardData.returnContact.phone,
      returnContactRelation: cardData.returnContact.relationship,
      qrCodeImage: cardData.qrCode,
    };

    const pdfBuffer = await PdfGenerator.renderTemplateToPdf("id_card", templateData, {
      printBackground: true,
    });

    return successResponse(pdfBuffer, "Student ID card PDF generated successfully.");
  }
}

