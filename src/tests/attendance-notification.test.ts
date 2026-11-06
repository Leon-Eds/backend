import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../config/db";
import { AttendanceService } from "../services/attendance.service";
import { emailService } from "../utils/email";
import { emailTemplates } from "../utils/email-templates";

const SCHOOL_ID = "00000000-0000-0000-0000-000000000001";
const CLASS_ID = "00000000-0000-0000-0000-000000000002";
const ADA_ID = "00000000-0000-0000-0000-00000000000a";
const BAYO_ID = "00000000-0000-0000-0000-00000000000b";
const CHIDI_ID = "00000000-0000-0000-0000-00000000000c";

const studentFixtures: Record<string, any> = {
  [ADA_ID]: { id: ADA_ID, fullName: "Ada Obi", arm: "A", class: { name: "JSS1" }, parent: { fullName: "Mrs Obi", email: "obi@example.test" } },
  [BAYO_ID]: { id: BAYO_ID, fullName: "Bayo Ade", arm: "A", class: { name: "JSS1" }, parent: { fullName: "Mr Ade", email: "ade@example.test" } },
  [CHIDI_ID]: { id: CHIDI_ID, fullName: "Chidi Eze", arm: "A", class: { name: "JSS1" }, parent: null },
};

/**
 * Stub the Prisma delegates used by the attendance service and capture outgoing
 * notifications. Restores everything after the callback runs.
 */
async function withAttendanceStubs(
  options: {
    existingRecords?: Array<{ studentId: string; status: string }>;
    notificationSettings?: any;
    sendError?: Error;
  },
  run: (sent: any[]) => Promise<void>
) {
  const originals = {
    classFindFirst: (prisma.class as any).findFirst,
    studentFindMany: (prisma.student as any).findMany,
    studentFindFirst: (prisma.student as any).findFirst,
    attendanceFindMany: (prisma.attendance as any).findMany,
    attendanceFindUnique: (prisma.attendance as any).findUnique,
    attendanceCount: (prisma.attendance as any).count,
    attendanceUpsert: (prisma.attendance as any).upsert,
    attendanceCreate: (prisma.attendance as any).create,
    schoolFindUnique: (prisma.school as any).findUnique,
    transaction: (prisma as any).$transaction,
    sendAttendanceNotifications: emailService.sendAttendanceNotifications,
  };
  const existingRecords = options.existingRecords || [];
  const sent: any[] = [];

  try {
    (prisma.class as any).findFirst = async () => ({ id: CLASS_ID, schoolId: SCHOOL_ID, name: "JSS1", arm: "A", formTeacherId: null });
    (prisma.student as any).findMany = async (args: any) => {
      const ids: string[] | undefined = args.where.id?.in;
      if (ids) return ids.map((id) => studentFixtures[id]).filter(Boolean);
      return Object.values(studentFixtures).map((student) => ({ id: student.id }));
    };
    (prisma.student as any).findFirst = async () => ({
      ...studentFixtures[ADA_ID],
      classId: CLASS_ID,
      class: { id: CLASS_ID, name: "JSS1", formTeacherId: null },
    });
    (prisma.attendance as any).findMany = async () => existingRecords;
    (prisma.attendance as any).findUnique = async (args: any) =>
      existingRecords.find((record) => record.studentId === args.where.schoolId_studentId_date.studentId) || null;
    (prisma.attendance as any).count = async () => existingRecords.length;
    (prisma.attendance as any).upsert = async (args: any) => args.create;
    (prisma.attendance as any).create = async (args: any) => args.data;
    (prisma as any).$transaction = async (operations: Promise<any>[]) => Promise.all(operations);
    (prisma.school as any).findUnique = async () => ({ name: "Unity Academy", notificationSettings: options.notificationSettings ?? null });
    emailService.sendAttendanceNotifications = async (notifications) => {
      if (options.sendError) throw options.sendError;
      sent.push(...notifications);
      return { success: true, sent: notifications.length };
    };

    await run(sent);
  } finally {
    (prisma.class as any).findFirst = originals.classFindFirst;
    (prisma.student as any).findMany = originals.studentFindMany;
    (prisma.student as any).findFirst = originals.studentFindFirst;
    (prisma.attendance as any).findMany = originals.attendanceFindMany;
    (prisma.attendance as any).findUnique = originals.attendanceFindUnique;
    (prisma.attendance as any).count = originals.attendanceCount;
    (prisma.attendance as any).upsert = originals.attendanceUpsert;
    (prisma.attendance as any).create = originals.attendanceCreate;
    (prisma.school as any).findUnique = originals.schoolFindUnique;
    (prisma as any).$transaction = originals.transaction;
    emailService.sendAttendanceNotifications = originals.sendAttendanceNotifications;
  }
}

// Attendance emails link to the parent portal, which requires a configured frontend URL
process.env.FRONTEND_URL ||= "https://www.leoned.ng";

const classSheet = {
  date: "2026-11-05",
  records: [
    { studentId: ADA_ID, status: "Absent", remarks: "Sick" },
    { studentId: BAYO_ID, status: "Present", remarks: "" },
    { studentId: CHIDI_ID, status: "Late", remarks: "" },
  ],
};

test("attendance email escapes names and remarks and keeps the subject on one line", () => {
  const { subject, html } = emailTemplates.getAttendanceNotification({
    parentName: "<b>Parent</b>",
    studentName: "Ada\r\nBcc: attacker@example.com",
    schoolName: "Unity Academy",
    className: "JSS1 A",
    date: "2026-11-05",
    status: "Absent",
    remarks: "<img src=x onerror=alert(1)>",
  });

  assert.doesNotMatch(subject, /[\r\n]/);
  assert.match(subject, /marked Absent/);
  assert.doesNotMatch(html, /<img|<b>Parent/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /Thursday, 5 November 2026/);
});

test("class attendance emails parents of new or changed records only and skips parents without email", async () => {
  await withAttendanceStubs(
    { existingRecords: [{ studentId: BAYO_ID, status: "Present" }] },
    async (sent) => {
      const result = await AttendanceService.recordClassAttendance(SCHOOL_ID, CLASS_ID, "admin-user", "SchoolAdmin", classSheet);

      assert.equal(result.success, true);
      // Bayo was already Present (unchanged) and Chidi has no parent email
      assert.deepEqual(sent.map((n) => [n.to, n.status, n.remarks]), [["obi@example.test", "Absent", "Sick"]]);
      assert.equal(sent[0].className, "JSS1 A");
      assert.equal(sent[0].schoolName, "Unity Academy");
    }
  );
});

test("class attendance respects the school's notification settings", async () => {
  await withAttendanceStubs(
    { notificationSettings: { attendance: { enabled: true, notifyOn: ["Absent", "Late"] } } },
    async (sent) => {
      await AttendanceService.recordClassAttendance(SCHOOL_ID, CLASS_ID, "admin-user", "SchoolAdmin", classSheet);
      assert.deepEqual(sent.map((n) => n.status), ["Absent"]);
    }
  );

  await withAttendanceStubs(
    { notificationSettings: { attendance: { enabled: false, notifyOn: ["Present", "Absent", "Late"] } } },
    async (sent) => {
      await AttendanceService.recordClassAttendance(SCHOOL_ID, CLASS_ID, "admin-user", "SchoolAdmin", classSheet);
      assert.equal(sent.length, 0);
    }
  );
});

test("attendance is still recorded when the notification email fails", async () => {
  await withAttendanceStubs(
    { sendError: new Error("Resend is down") },
    async () => {
      const result = await AttendanceService.recordClassAttendance(SCHOOL_ID, CLASS_ID, "admin-user", "SchoolAdmin", classSheet);
      assert.equal(result.success, true);
    }
  );
});

test("first QR scan of the day emails only the scanned student, not the defaulted absentees", async () => {
  await withAttendanceStubs({}, async (sent) => {
    const result = await AttendanceService.recordScanAttendance(SCHOOL_ID, "admin-user", "SchoolAdmin", {
      admissionNumber: "ADM-001",
      date: "2026-11-05",
    });

    assert.equal(result.success, true);
    assert.deepEqual(sent.map((n) => [n.to, n.status]), [["obi@example.test", "Present"]]);
  });
});

test("QR scan does not re-notify when the status is unchanged", async () => {
  await withAttendanceStubs(
    { existingRecords: [{ studentId: ADA_ID, status: "Present" }, { studentId: BAYO_ID, status: "Absent" }] },
    async (sent) => {
      await AttendanceService.recordScanAttendance(SCHOOL_ID, "admin-user", "SchoolAdmin", {
        admissionNumber: "ADM-001",
        date: "2026-11-05",
      });
      assert.equal(sent.length, 0);
    }
  );
});

test("attendance notifications are sent through Resend in batches of 100", async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFromEmail = process.env.FROM_EMAIL;
  const originalFetch = globalThis.fetch;
  const batchSizes: number[] = [];

  try {
    process.env.RESEND_API_KEY = "re_test_fixture";
    process.env.FROM_EMAIL = "LeonEd Africa <noreply@example.test>";
    globalThis.fetch = async (url, init) => {
      assert.match(String(url), /\/emails\/batch$/);
      const payload = JSON.parse(String(init?.body));
      batchSizes.push(payload.length);
      return new Response(
        JSON.stringify({ data: payload.map((_: unknown, i: number) => ({ id: `email_${i}` })) }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    const notifications = Array.from({ length: 150 }, (_, i) => ({
      to: `parent${i}@example.test`,
      parentName: "Parent",
      studentName: `Student ${i}`,
      schoolName: "Unity Academy",
      className: "JSS1 A",
      date: "2026-11-05",
      status: "Present" as const,
    }));

    const result = await emailService.sendAttendanceNotifications(notifications);
    assert.equal(result.sent, 150);
    assert.deepEqual(batchSizes, [100, 50]);
  } finally {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;

    if (originalFromEmail === undefined) delete process.env.FROM_EMAIL;
    else process.env.FROM_EMAIL = originalFromEmail;

    globalThis.fetch = originalFetch;
  }
});
