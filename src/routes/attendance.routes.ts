import { Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { recordAttendanceSchema } from "../validations/attendance.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: API for marking and tracking student daily attendance
 */

/**
 * @swagger
 * /api/attendance/my-form-classes:
 *   get:
 *     summary: Retrieve classes where the logged-in teacher is the assigned Form Teacher (Teachers only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Form classes list retrieved successfully
 */
router.get(
  "/my-form-classes",
  authMiddleware(["Teacher"]),
  requireSchoolId,
  AttendanceController.getMyFormClasses
);

/**
 * @swagger
 * /api/attendance/class/{classId}:
 *   get:
 *     summary: Get the attendance sheet for a class on a specific date (SchoolAdmin/Teacher)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format (defaults to today)
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Attendance sheet retrieved successfully
 */
router.get(
  "/class/:classId",
  authMiddleware(["SchoolAdmin", "Teacher"]),
  requireSchoolId,
  AttendanceController.getClassAttendanceSheet
);

/**
 * @swagger
 * /api/attendance/class/{classId}:
 *   post:
 *     summary: Record/update daily attendance for a class (SchoolAdmin/Teacher - only assigned Form Teacher if Teacher)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - records
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date in YYYY-MM-DD format
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                     - status
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [Present, Absent, Late]
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Attendance recorded successfully
 *       400:
 *         description: Bad request or validation failure
 *       403:
 *         description: Not authorized to take attendance for this class
 */
router.post(
  "/class/:classId",
  authMiddleware(["SchoolAdmin", "Teacher"]),
  requireSchoolId,
  validateBody(recordAttendanceSchema),
  AttendanceController.recordClassAttendance
);

/**
 * @swagger
 * /api/attendance/class/{classId}/stats:
 *   get:
 *     summary: Get attendance statistics for a class over a date range (SchoolAdmin/Teacher)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *         description: Start date in YYYY-MM-DD format (defaults to today)
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *         description: End date in YYYY-MM-DD format (defaults to today)
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get(
  "/class/:classId/stats",
  authMiddleware(["SchoolAdmin", "Teacher"]),
  requireSchoolId,
  AttendanceController.getClassAttendanceStats
);

/**
 * @swagger
 * /api/attendance/my-record:
 *   get:
 *     summary: Retrieve the logged-in student's daily attendance records and percentage for a term (Student only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         required: false
 *         schema:
 *           type: string
 *         description: The term ID (defaults to current active term)
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Student attendance record retrieved successfully
 */
router.get(
  "/my-record",
  authMiddleware(["Student"]),
  requireSchoolId,
  AttendanceController.getMyAttendanceRecord
);

export default router;
