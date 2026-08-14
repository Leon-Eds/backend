import QRCode from "qrcode";
import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class StudentCardService {
  /**
   * Returns student ID card data as a JSON payload containing:
   * school name, school logo URL, student name, admission number,
   * class, issue date (enrolled date), parent name, relationship,
   * parent phone number, and a QR code (base64 data URI).
   */
  static async getStudentIdCardData(schoolId: string, studentId: string): Promise<any> {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        class: true,
        parent: true,
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

    const cardData = {
      schoolName: school.name,
      schoolLogoUrl: school.logoUrl || null,
      studentName: student.fullName,
      profilePictureUrl: student.profilePictureUrl || null,
      admissionNumber: student.admissionNumber,
      class: className,
      issueDate: student.enrolledAt,
      parentName: student.parent?.fullName || null,
      relationship: student.parent?.relationship || null,
      parentPhoneNumber: student.parent?.phone || null,
      qrCode: qrCodeDataUri,
    };

    return successResponse(cardData, "Student ID card data retrieved successfully.");
  }
}
