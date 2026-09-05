import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import PDFDocument from "pdfkit";

export class ReportService {

  /**
   * 1. Students enrollment report based on academic session, class and gender
   */
  static async getEnrollmentReport(schoolId: string, query: any) {
    const { academicSessionId, classId, gender } = query;

    let records: Array<{
      id: string;
      fullName: string;
      admissionNumber: string;
      gender: "Male" | "Female";
      className: string;
      status: string;
      enrolledAt: Date;
    }>;

    if (academicSessionId) {
      const session = await prisma.academicSession.findFirst({
        where: { id: academicSessionId, schoolId },
      });
      if (!session) return failResponse("Academic session not found.");

      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          schoolId,
          academicSessionId,
          ...(classId ? { classId } : {}),
          ...(gender ? { student: { gender } } : {}),
        },
        include: { student: true, class: true },
        orderBy: { student: { fullName: "asc" } },
      });
      records = enrollments.map((enrollment) => ({
        id: enrollment.student.id,
        fullName: enrollment.student.fullName,
        admissionNumber: enrollment.student.admissionNumber,
        gender: enrollment.student.gender,
        className: `${enrollment.class.name} ${enrollment.class.arm}`.trim(),
        status: enrollment.status,
        enrolledAt: enrollment.startedAt,
      }));
    } else {
      const students = await prisma.student.findMany({
        where: {
          schoolId,
          ...(classId ? { classId } : {}),
          ...(gender ? { gender } : {}),
        },
        include: { class: true },
        orderBy: { fullName: "asc" },
      });
      records = students.map((student) => ({
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        gender: student.gender,
        className: student.class ? `${student.class.name} ${student.class.arm}`.trim() : "Unassigned",
        status: student.status,
        enrolledAt: student.enrolledAt,
      }));
    }

    const totalEnrolled = records.length;
    const maleCount = records.filter((record) => record.gender === "Male").length;
    const femaleCount = records.filter((record) => record.gender === "Female").length;

    // Group by Class
    const classGroups: { [key: string]: { name: string; count: number; male: number; female: number } } = {};
    records.forEach((record) => {
      const className = record.className;
      if (!classGroups[className]) {
        classGroups[className] = { name: className, count: 0, male: 0, female: 0 };
      }
      classGroups[className].count++;
      if (record.gender === "Male") classGroups[className].male++;
      if (record.gender === "Female") classGroups[className].female++;
    });

    return successResponse({
      totalEnrolled,
      genderBreakdown: { male: maleCount, female: femaleCount },
      classBreakdown: Object.values(classGroups),
      students: records,
    }, "Enrollment report generated.");
  }

  /**
   * 2. Attendance reports for students by class, academic session and term
   */
  static async getAttendanceReport(schoolId: string, query: any) {
    const { classId, academicSessionId, termId } = query;

    if (!classId || !termId) {
      return failResponse("classId and termId are required parameters for the attendance report.");
    }

    const term = await prisma.term.findFirst({
      where: { id: termId, academicSession: { schoolId } },
    });

    if (!term) {
      return failResponse("Term not found.");
    }
    if (academicSessionId && academicSessionId !== term.academicSessionId) {
      return failResponse("The selected term does not belong to the selected academic session.");
    }

    // Get number of attendance sessions recorded
    const attendances = await prisma.attendance.findMany({
      where: {
        schoolId,
        classId,
        date: {
          gte: term.startDate,
          lte: term.endDate,
        },
      },
    });

    // Extract unique dates as total days
    const uniqueDates = new Set(attendances.map((a) => a.date.toDateString()));
    const totalDaysCount = uniqueDates.size;

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { schoolId, academicSessionId: term.academicSessionId, classId },
      include: { student: true },
      orderBy: { student: { fullName: "asc" } },
    });

    const studentRecords = enrollments.map(({ student }) => {
      const studentAtt = attendances.filter((a) => a.studentId === student.id);
      const daysPresent = studentAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
      const daysAbsent = studentAtt.filter((a) => a.status === "Absent").length;
      const attendanceRate = totalDaysCount > 0 ? Math.round((daysPresent / totalDaysCount) * 1000) / 10 : 0;

      return {
        studentId: student.id,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        daysPresent,
        daysAbsent,
        attendanceRate: `${attendanceRate}%`,
      };
    });

    return successResponse({
      classId,
      termId,
      totalDaysRecorded: totalDaysCount,
      students: studentRecords,
    }, "Attendance report generated.");
  }

  /**
   * 3. Students academic performance reports by class, subject, academic session and term
   */
  static async getAcademicPerformanceReport(schoolId: string, query: any) {
    const { classId, subjectId, academicSessionId, termId } = query;

    if (!classId || !termId) {
      return failResponse("classId and termId are required for the academic performance report.");
    }

    const where: any = { schoolId, classId, termId };
    if (subjectId) {
      where.subjectId = subjectId;
    }

    const scores = await prisma.score.findMany({
      where,
      include: { student: true, subject: true },
    });

    if (scores.length === 0) {
      return successResponse({
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: "0%",
        gradeDistribution: {},
        scores: [],
      }, "No score records found.");
    }

    const totalSum = scores.reduce((sum, s) => sum + Number(s.total), 0);
    const averageScore = Math.round((totalSum / scores.length) * 100) / 100;
    const highestScore = Math.max(...scores.map((s) => Number(s.total)));
    const lowestScore = Math.min(...scores.map((s) => Number(s.total)));

    const passedCount = scores.filter((s) => Number(s.total) >= 40).length;
    const passRate = Math.round((passedCount / scores.length) * 100);

    const gradeDistribution: { [key: string]: number } = {};
    scores.forEach((s) => {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
    });

    return successResponse({
      averageScore,
      highestScore,
      lowestScore,
      passRate: `${passRate}%`,
      gradeDistribution,
      scores: scores.map((s) => ({
        studentName: s.student.fullName,
        admissionNumber: s.student.admissionNumber,
        subjectName: s.subject.name,
        firstCA: Number(s.firstCA),
        secondCA: Number(s.secondCA),
        exam: Number(s.exam),
        total: Number(s.total),
        grade: s.grade,
      })),
    }, "Academic performance report generated.");
  }

  /**
   * 4. Fee payment reports showing paid, pending and outstanding payments
   */
  static async getFeePaymentReport(schoolId: string, query: any) {
    const { termId } = query;

    if (!termId) {
      return failResponse("termId is required for the fee payment report.");
    }

    const term = await prisma.term.findFirst({
      where: { id: termId, academicSession: { schoolId } },
    });
    if (!term) return failResponse("Term not found.");

    const [fees, enrollments] = await Promise.all([
      prisma.feePayment.findMany({ where: { schoolId, termId } }),
      prisma.studentEnrollment.findMany({
        where: { schoolId, academicSessionId: term.academicSessionId },
        include: { student: true, class: true },
        orderBy: { student: { fullName: "asc" } },
      }),
    ]);

    const reportData = enrollments.map((enrollment) => {
      const fee = fees.find((payment) => payment.studentId === enrollment.studentId);
      const amountDue = fee ? Number(fee.amountDue) : 0;
      const amountPaid = fee ? Number(fee.amountPaid) : 0;
      const balance = amountDue - amountPaid;
      const status = fee ? fee.status : "NotRecorded";

      return {
        studentName: enrollment.student.fullName,
        admissionNumber: enrollment.student.admissionNumber,
        className: `${enrollment.class.name} ${enrollment.class.arm}`.trim(),
        amountDue,
        amountPaid,
        balance,
        status,
      };
    });

    const totalExpected = reportData.reduce((sum, r) => sum + r.amountDue, 0);
    const totalCollected = reportData.reduce((sum, r) => sum + r.amountPaid, 0);

    return successResponse({
      totalExpected,
      totalCollected,
      totalOutstanding: totalExpected - totalCollected,
      payments: reportData,
    }, "Fee payment report generated.");
  }

  /**
   * 5. Revenue reports showing total amount received within a selected date range
   */
  static async getRevenueReport(schoolId: string, query: any) {
    const { startDate, endDate } = query;

    if (!startDate || !endDate) {
      return failResponse("startDate and endDate are required parameters.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include full end date

    const payments = await prisma.feePaymentTransaction.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        student: {
          include: { class: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return successResponse({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalReceived,
      paymentsCount: payments.length,
      transactions: payments.map((p) => ({
        id: p.id,
        studentName: p.student.fullName,
        admissionNumber: p.student.admissionNumber,
        className: p.student.class ? `${p.student.class.name} ${p.student.class.arm}`.trim() : "Unassigned",
        amountPaid: Number(p.amount),
        paymentDate: p.createdAt,
        paymentMethod: p.method,
        reference: p.reference,
        description: p.description || "School fee payment",
      })),
    }, "Revenue report generated.");
  }

  /**
   * 6. Reports of promoted, graduated and left students
   */
  static async getStudentStatusReport(schoolId: string, query: any) {
    const { status, academicSessionId } = query;

    if (academicSessionId || status === "Promoted") {
      if (academicSessionId) {
        const sessionExists = await prisma.academicSession.findFirst({
          where: { id: academicSessionId, schoolId },
          select: { id: true },
        });
        if (!sessionExists) return failResponse("Academic session not found.");
      }

      const enrollmentWhere: any = {
        schoolId,
        ...(academicSessionId ? { academicSessionId } : {}),
        ...(status ? { status } : {}),
      };
      const countWhere = { schoolId, ...(academicSessionId ? { academicSessionId } : {}) };
      const [enrollments, active, promoted, graduated, left] = await Promise.all([
        prisma.studentEnrollment.findMany({
          where: enrollmentWhere,
          include: { student: true, class: true, promotedToClass: true, academicSession: true },
          orderBy: { student: { fullName: "asc" } },
        }),
        prisma.studentEnrollment.count({ where: { ...countWhere, status: "Active" } }),
        prisma.studentEnrollment.count({ where: { ...countWhere, status: "Promoted" } }),
        prisma.studentEnrollment.count({ where: { ...countWhere, status: "Graduated" } }),
        prisma.studentEnrollment.count({ where: { ...countWhere, status: "Left" } }),
      ]);

      return successResponse({
        counts: { Active: active, Promoted: promoted, Graduated: graduated, Left: left },
        students: enrollments.map((enrollment) => ({
          studentId: enrollment.studentId,
          fullName: enrollment.student.fullName,
          admissionNumber: enrollment.student.admissionNumber,
          academicSessionId: enrollment.academicSessionId,
          academicSessionName: enrollment.academicSession.name,
          classId: enrollment.classId,
          className: `${enrollment.class.name} ${enrollment.class.arm}`.trim(),
          promotedToClassId: enrollment.promotedToClassId,
          promotedToClassName: enrollment.promotedToClass
            ? `${enrollment.promotedToClass.name} ${enrollment.promotedToClass.arm}`.trim()
            : null,
          status: enrollment.status,
          enrolledAt: enrollment.startedAt,
          endedAt: enrollment.endedAt,
        })),
      }, "Student status report generated.");
    }

    const where: any = { schoolId };
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["Active", "Graduated", "Left"] };
    }

    const students = await prisma.student.findMany({
      where,
      include: { class: true },
      orderBy: { fullName: "asc" },
    });

    const [active, promoted, graduated, left] = await Promise.all([
      prisma.student.count({ where: { schoolId, status: "Active" } }),
      prisma.studentEnrollment.count({ where: { schoolId, status: "Promoted" } }),
      prisma.student.count({ where: { schoolId, status: "Graduated" } }),
      prisma.student.count({ where: { schoolId, status: "Left" } }),
    ]);
    const counts = { Active: active, Promoted: promoted, Graduated: graduated, Left: left };

    return successResponse({
      counts,
      students: students.map((s) => ({
        studentId: s.id,
        fullName: s.fullName,
        admissionNumber: s.admissionNumber,
        className: s.class ? `${s.class.name} ${s.class.arm}`.trim() : "Unassigned",
        status: s.status,
        enrolledAt: s.enrolledAt,
      })),
    }, "Student status report generated.");
  }

  /**
   * 7. Staff reports showing teachers, form teachers and bursars active
   */
  static async getStaffReport(schoolId: string) {
    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      include: {
        formClasses: true,
      },
      orderBy: { fullName: "asc" },
    });

    const bursars = await prisma.user.findMany({
      where: { schoolId, role: "Bursar" },
      orderBy: { name: "asc" },
    });

    const activeTeachersCount = teachers.filter((t) => t.isActive).length;
    const activeBursarsCount = bursars.filter((b) => b.isActive).length;

    return successResponse({
      totals: {
        teachers: activeTeachersCount,
        bursars: activeBursarsCount,
        staff: activeTeachersCount + activeBursarsCount,
      },
      teachers: teachers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        isActive: t.isActive,
        isFormTeacherOf: t.formClasses.map((c) => `${c.name} ${c.arm}`.trim()),
      })),
      bursars: bursars.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        isActive: b.isActive,
      })),
    }, "Staff report generated.");
  }

  /**
   * 8. Reports of students with outstanding school fees (debtors)
   */
  static async getOutstandingFeesReport(schoolId: string, query: any) {
    const { termId } = query;

    if (!termId) {
      return failResponse("termId query parameter is required.");
    }

    const term = await prisma.term.findFirst({
      where: { id: termId, academicSession: { schoolId } },
    });
    if (!term) return failResponse("Term not found.");

    const fees = await prisma.feePayment.findMany({
      where: {
        schoolId,
        termId,
        status: { not: "Cleared" },
      },
      include: { student: true },
    });
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        academicSessionId: term.academicSessionId,
        studentId: { in: fees.map((fee) => fee.studentId) },
      },
      include: { class: true },
    });
    const enrollmentByStudentId = new Map(
      enrollments.map((enrollment) => [enrollment.studentId, enrollment])
    );

    const debtors = fees.map((f) => {
      const amountDue = Number(f.amountDue);
      const amountPaid = Number(f.amountPaid);
      const balance = amountDue - amountPaid;

      const enrollment = enrollmentByStudentId.get(f.studentId);
      return {
        studentId: f.studentId,
        studentName: f.student.fullName,
        admissionNumber: f.student.admissionNumber,
        className: enrollment
          ? `${enrollment.class.name} ${enrollment.class.arm}`.trim()
          : "Unassigned",
        amountDue,
        amountPaid,
        balance,
      };
    }).filter((d) => d.balance > 0);

    const totalOutstanding = debtors.reduce((sum, d) => sum + d.balance, 0);

    return successResponse({
      debtorsCount: debtors.length,
      totalOutstanding,
      debtors,
    }, "Outstanding fees report generated.");
  }

  /**
   * Generate CSV for a given report type
   */
  static generateCsv(reportType: string, data: any): string {
    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case "enrollment":
        headers = ["Full Name", "Admission Number", "Gender", "Class Name", "Status", "Enrolled At"];
        rows = (data.students || []).map((s: any) => [
          s.fullName,
          s.admissionNumber,
          s.gender,
          s.className,
          s.status,
          new Date(s.enrolledAt).toLocaleDateString(),
        ]);
        break;

      case "attendance":
        headers = ["Student Name", "Admission Number", "Days Present", "Days Absent", "Attendance Rate"];
        rows = (data.students || []).map((s: any) => [
          s.studentName,
          s.admissionNumber,
          s.daysPresent.toString(),
          s.daysAbsent.toString(),
          s.attendanceRate,
        ]);
        break;

      case "performance":
        headers = ["Student Name", "Admission Number", "Subject Name", "CA1", "CA2", "Exam", "Total", "Grade"];
        rows = (data.scores || []).map((s: any) => [
          s.studentName,
          s.admissionNumber,
          s.subjectName,
          s.firstCA.toString(),
          s.secondCA.toString(),
          s.exam.toString(),
          s.total.toString(),
          s.grade,
        ]);
        break;

      case "feepayment":
        headers = ["Student Name", "Admission Number", "Class Name", "Amount Due", "Amount Paid", "Outstanding Balance", "Status"];
        rows = (data.payments || []).map((p: any) => [
          p.studentName,
          p.admissionNumber,
          p.className,
          p.amountDue.toString(),
          p.amountPaid.toString(),
          p.balance.toString(),
          p.status,
        ]);
        break;

      case "revenue":
        headers = ["Transaction Date", "Student Name", "Class Name", "Amount Paid", "Description"];
        rows = (data.transactions || []).map((t: any) => [
          new Date(t.paymentDate).toLocaleDateString(),
          t.studentName,
          t.className,
          t.amountPaid.toString(),
          t.description,
        ]);
        break;

      case "studentstatus":
        headers = ["Full Name", "Admission Number", "Class Name", "Status", "Enrolled At"];
        rows = (data.students || []).map((s: any) => [
          s.fullName,
          s.admissionNumber,
          s.className,
          s.status,
          new Date(s.enrolledAt).toLocaleDateString(),
        ]);
        break;

      case "staff":
        headers = ["Staff Name", "Role", "Email", "Phone", "Is Active", "Form Class Assigned"];
        const tRows = (data.teachers || []).map((t: any) => [
          t.fullName,
          "Teacher",
          t.email,
          t.phone,
          t.isActive ? "Yes" : "No",
          t.isFormTeacherOf.join(", ") || "None",
        ]);
        const bRows = (data.bursars || []).map((b: any) => [
          b.name,
          "Bursar",
          b.email,
          "-",
          b.isActive ? "Yes" : "No",
          "-",
        ]);
        rows = [...tRows, ...bRows];
        break;

      case "outstandingfees":
        headers = ["Student Name", "Admission Number", "Class Name", "Amount Due", "Amount Paid", "Outstanding Balance"];
        rows = (data.debtors || []).map((d: any) => [
          d.studentName,
          d.admissionNumber,
          d.className,
          d.amountDue.toString(),
          d.amountPaid.toString(),
          d.balance.toString(),
        ]);
        break;

      default:
        headers = ["No data"];
        rows = [];
    }

    const escapeCsvValue = (value: string) => {
      const stringValue = String(value ?? "");
      const formulaSafeValue = /^[\t\r\n ]*[=+\-@]/.test(stringValue)
        ? `'${stringValue}`
        : stringValue;
      return `"${formulaSafeValue.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    return csvContent;
  }
}
