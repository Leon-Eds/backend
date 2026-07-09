import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class StudentCardService {
  /**
   * Helper to fetch an image from a URL and return a Buffer.
   * Returns null if the fetch fails or URL is invalid.
   */
  private static async fetchImageBuffer(url: string): Promise<Buffer | null> {
    if (!url || !url.startsWith("http")) {
      return null;
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (err) {
      console.error("[StudentCardService] Failed to fetch remote image:", url, err);
    }
    return null;
  }

  /**
   * Generates a high-fidelity, themed PDF Student ID Card.
   * Page size: CR80 card size (scaled up slightly for high quality print: 240 x 360 points).
   */
  static async generateStudentIdCardPdf(schoolId: string, studentId: string): Promise<any> {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        class: true,
        user: true,
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

    // Resolve school colors
    const theme = (school.schoolTheme as any) || {};
    const primaryColor = theme.primaryColor || "#1e3a8a"; // Sleek Dark Blue
    const secondaryColor = theme.secondaryColor || "#1e293b"; // Charcoal/Slate
    const accentColor = theme.accentColor || "#3b82f6"; // Electric Blue
    const cardBg = "#ffffff";
    const borderGrey = "#cbd5e1";
    const textGrey = "#475569";

    // Setup CR80-sized PDF document (240 pt width x 360 pt height)
    const doc = new PDFDocument({ size: [240, 360], margin: 10 });
    const buffers: Buffer[] = [];
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
    });

    // 1. Draw Card Background & Outer Border
    doc.rect(5, 5, 230, 350).fill(cardBg);
    doc.rect(5, 5, 230, 350).lineWidth(2).strokeColor(primaryColor).stroke();

    // 2. Draw Top Accent Bar
    doc.rect(6, 6, 228, 55).fill(primaryColor);

    // Fetch School Logo
    const logoBuffer = await this.fetchImageBuffer(school.logoUrl);
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 12, 10, { width: 32, height: 32 });
      } catch (err) {
        // Draw elegant vector logo if image load fails
        this.drawLogoPlaceholder(doc, 12, 10, 32);
      }
    } else {
      this.drawLogoPlaceholder(doc, 12, 10, 32);
    }

    // School Header Text (positioned next to logo)
    doc.fillColor("#ffffff").fontSize(9).text(school.name.toUpperCase(), 50, 12, {
      width: 175,
      height: 24,
      bold: true,
      align: "left",
    } as any);

    // Contact/Subheader
    doc.fillColor("#e2e8f0").fontSize(6.5).text("STUDENT IDENTITY CARD", 50, 36, {
      width: 175,
      align: "left",
      bold: true,
    } as any);

    // 3. Draw Profile Picture Container
    const photoX = 20;
    const photoY = 80;
    const photoW = 75;
    const photoH = 85;

    // Draw picture frame/shadow
    doc.rect(photoX, photoY, photoW, photoH).lineWidth(1).strokeColor(borderGrey).stroke();

    // Fetch Student Profile Image
    const studentPhotoBuffer = await this.fetchImageBuffer(student.profilePictureUrl);
    if (studentPhotoBuffer) {
      try {
        doc.image(studentPhotoBuffer, photoX + 1, photoY + 1, { width: photoW - 2, height: photoH - 2 });
      } catch (err) {
        this.drawStudentPhotoPlaceholder(doc, photoX + 1, photoY + 1, photoW - 2, photoH - 2);
      }
    } else {
      this.drawStudentPhotoPlaceholder(doc, photoX + 1, photoY + 1, photoW - 2, photoH - 2);
    }

    // 4. Details List (on the right side of the photo)
    const detailsX = 105;
    let currentY = 85;
    const rowHeight = 15;

    doc.fillColor(primaryColor).fontSize(6.5).text("FULL NAME", detailsX, currentY, { bold: true } as any);
    doc.fillColor(secondaryColor).fontSize(8).text(student.fullName, detailsX, currentY + 7, { bold: true, width: 120 } as any);
    currentY += rowHeight + 10;

    doc.fillColor(primaryColor).fontSize(6.5).text("ADMISSION NO", detailsX, currentY, { bold: true } as any);
    doc.fillColor(textGrey).fontSize(7.5).text(student.admissionNumber, detailsX, currentY + 7, { bold: true } as any);
    currentY += rowHeight + 4;

    const className = student.class ? `${student.class.name} ${student.arm || ""}`.trim() : "N/A";
    doc.fillColor(primaryColor).fontSize(6.5).text("CLASS", detailsX, currentY, { bold: true } as any);
    doc.fillColor(textGrey).fontSize(7.5).text(className, detailsX, currentY + 7, { bold: true } as any);
    currentY += rowHeight + 4;

    doc.fillColor(primaryColor).fontSize(6.5).text("GENDER", detailsX, currentY, { bold: true } as any);
    doc.fillColor(textGrey).fontSize(7.5).text(student.gender, detailsX, currentY + 7);

    // 5. Generate and Embed QR Code containing specific details
    const qrData = JSON.stringify({
      schoolName: school.name,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
    });
    
    let qrBuffer: Buffer;
    try {
      qrBuffer = await QRCode.toBuffer(qrData, {
        margin: 0,
        width: 60,
        color: {
          dark: secondaryColor,
          light: "#ffffff"
        }
      });
      // Draw QR Code
      doc.image(qrBuffer, 25, 205, { width: 65, height: 65 });
    } catch (err) {
      console.error("[StudentCardService] QR Code generation failed:", err);
    }

    // QR Label/Status
    doc.fillColor(primaryColor).fontSize(6.5).text("SYSTEM VERIFIED", 20, 275, {
      width: 75,
      align: "center",
      bold: true,
    } as any);

    // 6. Parent/Guardian & Contact details on the right of QR code
    const bottomDetailsX = 105;
    let bottomY = 205;

    doc.fillColor(primaryColor).fontSize(6.5).text("BLOOD GROUP", bottomDetailsX, bottomY, { bold: true } as any);
    doc.fillColor(textGrey).fontSize(7.5).text(student.bloodGroup || "N/A", bottomDetailsX, bottomY + 7);
    bottomY += rowHeight + 4;

    doc.fillColor(primaryColor).fontSize(6.5).text("EMERGENCY CONTACT", bottomDetailsX, bottomY, { bold: true } as any);
    doc.fillColor(textGrey).fontSize(7.5).text(school.contactPhone || "N/A", bottomDetailsX, bottomY + 7);
    bottomY += rowHeight + 4;

    // 7. Footer details
    doc.rect(6, 320, 228, 34).fill(secondaryColor);
    doc.fillColor("#ffffff").fontSize(6).text(school.address || "LeonEd Multi-Tenant School Portal", 10, 326, {
      width: 220,
      align: "center",
    });
    doc.fillColor("#94a3b8").fontSize(5.5).text("Valid only when signed by administration. System generated.", 10, 342, {
      width: 220,
      align: "center",
    });

    doc.end();

    const pdfBuffer = await pdfPromise;
    return successResponse(pdfBuffer, "ID Card PDF generated successfully.");
  }

  private static drawLogoPlaceholder(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
    doc.rect(x, y, size, size).fill("#3b82f6");
    doc.fillColor("#ffffff").fontSize(8).text("EDU", x, y + 12, { width: size, align: "center", bold: true } as any);
  }

  private static drawStudentPhotoPlaceholder(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number) {
    doc.rect(x, y, w, h).fill("#f1f5f9");
    doc.fillColor("#94a3b8").fontSize(7).text("NO PHOTO", x, y + (h / 2) - 4, { width: w, align: "center" });
  }
}
