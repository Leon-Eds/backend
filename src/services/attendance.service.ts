import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

export class AttendanceService {

  /**
   * Helper: Resolve teacher from userId and schoolId
   */
  private static async resolveTeacher(schoolId: string, userId: string) {
    return prisma.teacher.findFirst({
      where: { userId, schoolId },
    });
  }

  /**
   * Get all classes where the logged-in teacher is the Form Teacher.
   */
  static async getMyFormClasses(schoolId: string, userId: string) {
    const teacher = await this.resolveTeacher(schoolId, userId);
    if (!teacher) {
      return failResponse("Teacher profile not found.");
    }

    const classes = await prisma.class.findMany({
      where: { schoolId, formTeacherId: teacher.id },
      include: {
        students: {
          where: { status: "Active" },
          select: { id: true },
        },
        academicSession: true,
      },
      orderBy: { name: "asc" },
    });

    const items = classes.map((c) => ({
      id: c.id,
      name: c.name,
      arm: c.arm,
      className: `${c.name} ${c.arm}`.trim(),
      studentCount: c.students.length,
      academicSessionName: c.academicSession?.name || null,
    }));

    return successResponse(items);
  }

  /**
   * Get attendance sheet for a class on a specific date.
   * If a student does not have attendance marked, their status is returned as null.
   */
  static async getClassAttendanceSheet(schoolId: string, classId: string, dateStr: string) {
    // Check class existence
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    // Standardize date to T00:00:00.000Z to avoid local timezone offset shifts
    const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Fetch active students in this class
    const students = await prisma.student.findMany({
      where: { classId, schoolId, status: "Active" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        profilePictureUrl: true,
      },
    });

    // Fetch attendance records for this class on this date
    const attendances = await prisma.attendance.findMany({
      where: {
        schoolId,
        classId,
        date: parsedDate,
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.studentId, a]));

    const records = students.map((student) => {
      const att = attendanceMap.get(student.id);
      return {
        studentId: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        profilePictureUrl: student.profilePictureUrl,
        status: att ? att.status : null,
        remarks: att ? att.remarks : "",
      };
    });

    return successResponse({
      classId: classEntity.id,
      className: `${classEntity.name} ${classEntity.arm}`.trim(),
      date: dateStr,
      records,
    });
  }

  /**
   * Record or update daily attendance for a class.
   * Only the form teacher of the class (or SchoolAdmin) can execute this.
   */
  static async recordClassAttendance(
    schoolId: string,
    classId: string,
    userId: string,
    userRole: string,
    request: any
  ) {
    const classEntity = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      return failResponse("Class not found.");
    }

    let teacherId: string | null = null;

    // Enforce form teacher constraint
    if (userRole === "Teacher") {
      const teacher = await this.resolveTeacher(schoolId, userId);
      if (!teacher) {
        return failResponse("Teacher profile not found.");
      }

      if (classEntity.formTeacherId !== teacher.id) {
        return failResponse("Access Denied: Only the assigned Form Teacher of this class can take attendance.");
      }
      teacherId = teacher.id;
    }

    const parsedDate = new Date(`${request.date}T00:00:00.000Z`);

    // Create or update records in a transaction
    const operations = request.records.map((rec: any) => {
      const data = {
        schoolId,
        classId,
        studentId: rec.studentId,
        date: parsedDate,
        status: rec.status,
        remarks: rec.remarks || "",
        takenByTeacherId: teacherId,
      };

      return prisma.attendance.upsert({
        where: {
          schoolId_studentId_date: {
            schoolId,
            studentId: rec.studentId,
            date: parsedDate,
          },
        },
        create: data,
        update: {
          status: rec.status,
          remarks: rec.remarks || "",
          takenByTeacherId: teacherId,
        },
      });
    });

    await prisma.$transaction(operations);

    return successResponse(true, "Attendance recorded successfully.");
  }

  /**
   * Get stats for a class over a date range
   */
  static async getClassAttendanceStats(
    schoolId: string,
    classId: string,
    startDateStr: string,
    endDateStr: string
  ) {
    const start = new Date(`${startDateStr}T00:00:00.000Z`);
    const end = new Date(`${endDateStr}T23:59:59.999Z`);

    const students = await prisma.student.findMany({
      where: { classId, schoolId, status: "Active" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
      },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        schoolId,
        classId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Compute stats
    const studentStats = students.map((student) => {
      const studentAtts = attendances.filter((a) => a.studentId === student.id);
      const totalDays = studentAtts.length;
      const present = studentAtts.filter((a) => a.status === "Present").length;
      const absent = studentAtts.filter((a) => a.status === "Absent").length;
      const late = studentAtts.filter((a) => a.status === "Late").length;

      const attendancePercentage = totalDays > 0 
        ? Math.round(((present + late) / totalDays) * 100)
        : 100; // default to 100 if no days recorded

      return {
        studentId: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        totalDays,
        present,
        absent,
        late,
        attendancePercentage,
      };
    });

    return successResponse({
      classId,
      startDate: startDateStr,
      endDate: endDateStr,
      stats: studentStats,
    });
  }

  static async getMyAttendanceRecord(schoolId: string, userId: string, termId?: string) {
    const student = await prisma.student.findFirst({
      where: { userId, schoolId },
    });

    if (!student) {
      return failResponse("Student profile not found.");
    }

    let term;
    if (termId) {
      term = await prisma.term.findFirst({
        where: { id: termId },
        include: { academicSession: true },
      });
    } else {
      const currentSession = await prisma.academicSession.findFirst({
        where: { schoolId, isCurrent: true },
      });
      if (currentSession) {
        term = await prisma.term.findFirst({
          where: { academicSessionId: currentSession.id, isCurrent: true },
          include: { academicSession: true },
        });
      }
    }

    if (!term) {
      return failResponse("Active term context not found.");
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        schoolId,
        studentId: student.id,
        date: {
          gte: term.startDate,
          lte: term.endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    const totalDays = attendances.length;
    const present = attendances.filter((a) => a.status === "Present").length;
    const absent = attendances.filter((a) => a.status === "Absent").length;
    const late = attendances.filter((a) => a.status === "Late").length;

    const attendancePercentage = totalDays > 0 
      ? Math.round(((present + late) / totalDays) * 100)
      : 100;

    const records = attendances.map((a) => ({
      date: a.date.toISOString().split("T")[0],
      status: a.status,
      remarks: a.remarks,
    }));

    return successResponse({
      studentId: student.id,
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
      termId: term.id,
      termName: term.termNumber,
      sessionName: term.academicSession?.name || null,
      totalDays,
      present,
      absent,
      late,
      attendancePercentage,
      records,
    }, "Student attendance records retrieved.");
  }

  /**
   * Scan QR Code / ID card to record attendance for a student.
   * Auto-initializes other active class students as Absent if daily sheet doesn't exist.
   */
  static async recordScanAttendance(
    schoolId: string,
    userId: string,
    userRole: string,
    request: any
  ) {
    const student = await prisma.student.findFirst({
      where: {
        schoolId,
        admissionNumber: { equals: request.admissionNumber, mode: "insensitive" }
      },
      include: { class: true }
    });

    if (!student || !student.classId || !student.class) {
      return failResponse("Student profile or class assignment not found.");
    }

    let teacherId: string | null = null;
    let teacherProfile: any = null;

    // Enforce Form Teacher boundary
    if (userRole === "Teacher") {
      teacherProfile = await this.resolveTeacher(schoolId, userId);
      if (!teacherProfile) {
        return failResponse("Teacher profile not found.");
      }

      if (student.class.formTeacherId !== teacherProfile.id) {
        return failResponse("Access Denied: Only the assigned Form Teacher of this class can take attendance.");
      }
      teacherId = teacherProfile.id;
    }

    const parsedDate = new Date(`${request.date}T00:00:00.000Z`);

    // Check if daily sheet exists
    const existingCount = await prisma.attendance.count({
      where: {
        schoolId,
        classId: student.classId,
        date: parsedDate,
      }
    });

    if (existingCount === 0) {
      // Find all active students in class
      const activeStudents = await prisma.student.findMany({
        where: {
          classId: student.classId,
          schoolId,
          status: "Active",
        }
      });

      // Auto-initialize other students as Absent (Unscanned)
      const operations = activeStudents.map((s) => {
        const isScanned = s.id === student.id;
        const data = {
          schoolId,
          classId: student.classId!,
          studentId: s.id,
          date: parsedDate,
          status: isScanned ? (request.status || "Present") : "Absent",
          remarks: isScanned ? (request.remarks || "Scanned QR Code") : "Unscanned (Default Absent)",
          takenByTeacherId: teacherId,
        };

        return prisma.attendance.create({ data });
      });

      await prisma.$transaction(operations);
    } else {
      // Daily sheet already exists, upsert just this student
      const data = {
        schoolId,
        classId: student.classId,
        studentId: student.id,
        date: parsedDate,
        status: request.status || "Present",
        remarks: request.remarks || "Scanned QR Code",
        takenByTeacherId: teacherId,
      };

      await prisma.attendance.upsert({
        where: {
          schoolId_studentId_date: {
            schoolId,
            studentId: student.id,
            date: parsedDate,
          }
        },
        create: data,
        update: {
          status: request.status || "Present",
          remarks: request.remarks || "Scanned QR Code",
          takenByTeacherId: teacherId,
        }
      });
    }

    return successResponse(true, "Attendance recorded successfully via QR code scan.");
  }
}

