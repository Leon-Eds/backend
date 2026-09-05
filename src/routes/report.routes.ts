import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { createRateLimiter } from "../middlewares/security.middleware";

const router = Router();
const exportLimit = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20, keyPrefix: "report-export" });

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API for generating comprehensive school reports (Enrollment, Attendance, Performance, Fees, Revenue, Staff)
 */

/**
 * @swagger
 * /api/report/enrollment:
 *   get:
 *     summary: Generate students enrollment report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicSessionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic session ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by class ID
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female]
 *         description: Filter by student gender
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Enrollment report retrieved successfully
 */
router.get("/enrollment", authMiddleware(["SchoolAdmin"]), requireSchoolId, ReportController.getEnrollmentReport);

/**
 * @swagger
 * /api/report/attendance:
 *   get:
 *     summary: Generate student attendance reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance report retrieved successfully
 */
router.get("/attendance", authMiddleware(["SchoolAdmin"]), requireSchoolId, ReportController.getAttendanceReport);

/**
 * @swagger
 * /api/report/performance:
 *   get:
 *     summary: Generate academic performance reports by class and subject
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance report retrieved successfully
 */
router.get("/performance", authMiddleware(["SchoolAdmin"]), requireSchoolId, ReportController.getAcademicPerformanceReport);

/**
 * @swagger
 * /api/report/feepayment:
 *   get:
 *     summary: Generate fee payment reports showing paid, pending and outstanding payments
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fee payment report retrieved successfully
 */
router.get("/feepayment", authMiddleware(["SchoolAdmin", "Bursar"]), requireSchoolId, ReportController.getFeePaymentReport);

/**
 * @swagger
 * /api/report/revenue:
 *   get:
 *     summary: Generate revenue reports showing total amount received within a selected date range
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Revenue report retrieved successfully
 */
router.get("/revenue", authMiddleware(["SchoolAdmin", "Bursar"]), requireSchoolId, ReportController.getRevenueReport);

/**
 * @swagger
 * /api/report/studentstatus:
 *   get:
 *     summary: Report of student statuses (promoted, graduated, left)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Promoted, Graduated, Left]
 *       - in: query
 *         name: academicSessionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Read statuses from the historical enrollment ledger for this session
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student status report retrieved successfully
 */
router.get("/studentstatus", authMiddleware(["SchoolAdmin"]), requireSchoolId, ReportController.getStudentStatusReport);

/**
 * @swagger
 * /api/report/staff:
 *   get:
 *     summary: Generate active staff report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff report retrieved successfully
 */
router.get("/staff", authMiddleware(["SchoolAdmin"]), requireSchoolId, ReportController.getStaffReport);

/**
 * @swagger
 * /api/report/outstandingfees:
 *   get:
 *     summary: Generate report of students with outstanding school fees
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outstanding fees report retrieved successfully
 */
router.get("/outstandingfees", authMiddleware(["SchoolAdmin", "Bursar"]), requireSchoolId, ReportController.getOutstandingFeesReport);

/**
 * @swagger
 * /api/report/export:
 *   get:
 *     summary: Export any generated report in PDF or CSV format
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [enrollment, attendance, performance, feepayment, revenue, studentstatus, staff, outstandingfees]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, csv]
 *           default: csv
 *       - in: query
 *         name: academicSessionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exported report file
 */
router.get("/export", exportLimit, authMiddleware(["SchoolAdmin", "Bursar"]), requireSchoolId, ReportController.exportReport);

export default router;
