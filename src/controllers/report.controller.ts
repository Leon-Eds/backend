import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";
import PDFDocument from "pdfkit";

export class ReportController {

  static async getEnrollmentReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getEnrollmentReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getAttendanceReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAcademicPerformanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getAcademicPerformanceReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getFeePaymentReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getFeePaymentReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getRevenueReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentStatusReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getStudentStatusReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStaffReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getStaffReport(schoolId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getOutstandingFeesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const result = await ReportService.getOutstandingFeesReport(schoolId, req.query);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId as string;
      const reportType = req.query.type as string;
      const format = (req.query.format as string || "csv").toLowerCase();

      if (!reportType) {
        return res.status(400).json({ success: false, message: "Query parameter 'type' is required." });
      }

      let reportResult: any;
      switch (reportType) {
        case "enrollment":
          reportResult = await ReportService.getEnrollmentReport(schoolId, req.query);
          break;
        case "attendance":
          reportResult = await ReportService.getAttendanceReport(schoolId, req.query);
          break;
        case "performance":
          reportResult = await ReportService.getAcademicPerformanceReport(schoolId, req.query);
          break;
        case "feepayment":
          reportResult = await ReportService.getFeePaymentReport(schoolId, req.query);
          break;
        case "revenue":
          reportResult = await ReportService.getRevenueReport(schoolId, req.query);
          break;
        case "studentstatus":
          reportResult = await ReportService.getStudentStatusReport(schoolId, req.query);
          break;
        case "staff":
          reportResult = await ReportService.getStaffReport(schoolId);
          break;
        case "outstandingfees":
          reportResult = await ReportService.getOutstandingFeesReport(schoolId, req.query);
          break;
        default:
          return res.status(400).json({ success: false, message: `Invalid report type: ${reportType}` });
      }

      if (!reportResult.success || !reportResult.data) {
        return res.status(400).json(reportResult);
      }

      const data = reportResult.data;

      if (format === "pdf") {
        let headers: string[] = [];
        let rows: string[][] = [];
        const title = `${reportType.toUpperCase()} REPORT`;

        if (reportType === "enrollment") {
          headers = ["Full Name", "Admission No", "Gender", "Class", "Status"];
          rows = (data.students || []).map((s: any) => [s.fullName, s.admissionNumber, s.gender, s.className, s.status]);
        } else if (reportType === "attendance") {
          headers = ["Student Name", "Admission No", "Present", "Absent", "Rate"];
          rows = (data.students || []).map((s: any) => [s.studentName, s.admissionNumber, s.daysPresent.toString(), s.daysAbsent.toString(), s.attendanceRate]);
        } else if (reportType === "performance") {
          headers = ["Student Name", "Subject", "CA1", "CA2", "Exam", "Total", "Grade"];
          rows = (data.scores || []).map((s: any) => [s.studentName, s.subjectName, s.firstCA.toString(), s.secondCA.toString(), s.exam.toString(), s.total.toString(), s.grade]);
        } else if (reportType === "feepayment") {
          headers = ["Student Name", "Class", "Due", "Paid", "Balance", "Status"];
          rows = (data.payments || []).map((p: any) => [p.studentName, p.className, p.amountDue.toString(), p.amountPaid.toString(), p.balance.toString(), p.status]);
        } else if (reportType === "revenue") {
          headers = ["Date", "Student Name", "Class", "Amount Paid", "Description"];
          rows = (data.transactions || []).map((t: any) => [new Date(t.paymentDate).toLocaleDateString(), t.studentName, t.className, t.amountPaid.toString(), t.description]);
        } else if (reportType === "studentstatus") {
          headers = ["Full Name", "Admission No", "Class", "Status"];
          rows = (data.students || []).map((s: any) => [s.fullName, s.admissionNumber, s.className, s.status]);
        } else if (reportType === "staff") {
          headers = ["Name", "Role", "Email", "Phone", "Status"];
          const tRows = (data.teachers || []).map((t: any) => [t.fullName, "Teacher", t.email, t.phone, t.isActive ? "Active" : "Inactive"]);
          const bRows = (data.bursars || []).map((b: any) => [b.name, "Bursar", b.email, "-", b.isActive ? "Active" : "Inactive"]);
          rows = [...tRows, ...bRows];
        } else if (reportType === "outstandingfees") {
          headers = ["Student Name", "Class", "Due", "Paid", "Balance"];
          rows = (data.debtors || []).map((d: any) => [d.studentName, d.className, d.amountDue.toString(), d.amountPaid.toString(), d.balance.toString()]);
        }

        const pdfBuffer = await ReportController.generateReportPdfBuffer(title, headers, rows);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${reportType}_report.pdf"`);
        return res.send(pdfBuffer);
      } else {
        // Default to CSV
        const csvContent = ReportService.generateCsv(reportType, data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${reportType}_report.csv"`);
        return res.send(csvContent);
      }
    } catch (error) {
      next(error);
    }
  }

  private static generateReportPdfBuffer(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 30 });
    const buffers: Buffer[] = [];
    return new Promise((resolve, reject) => {
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Draw header
      doc.fillColor("#1e3a8a").fontSize(18).text(title, { align: "center", bold: true } as any);
      doc.moveDown(0.5);
      doc.fillColor("#6b7280").fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(1.5);

      // Draw table
      const startX = 30;
      let startY = doc.y;
      const totalWidth = 535;
      const colWidth = totalWidth / headers.length;

      // Draw header row
      doc.rect(startX, startY, totalWidth, 20).fillColor("#1e3a8a").fill();
      doc.fillColor("#ffffff").fontSize(8);
      headers.forEach((h, i) => {
        doc.text(h, startX + i * colWidth + 5, startY + 6, { width: colWidth - 10, align: "left" });
      });
      startY += 20;

      // Draw data rows
      doc.fillColor("#374151");
      rows.forEach((row, rowIndex) => {
        // Alternating row background
        if (rowIndex % 2 === 1) {
          doc.rect(startX, startY, totalWidth, 18).fillColor("#f9fafb").fill();
        }
        doc.fillColor("#374151");
        row.forEach((cell, cellIndex) => {
          doc.text(cell || "", startX + cellIndex * colWidth + 5, startY + 5, { width: colWidth - 10, align: "left" });
        });
        startY += 18;

        // If page is about to end, add new page
        if (startY > 780) {
          doc.addPage();
          startY = 40;
          // Re-draw header row on new page
          doc.rect(startX, startY, totalWidth, 20).fillColor("#1e3a8a").fill();
          doc.fillColor("#ffffff").fontSize(8);
          headers.forEach((h, i) => {
            doc.text(h, startX + i * colWidth + 5, startY + 6, { width: colWidth - 10, align: "left" });
          });
          startY += 20;
        }
      });

      doc.end();
    });
  }
}
