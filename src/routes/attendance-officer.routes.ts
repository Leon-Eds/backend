import { Router } from "express";
import { AttendanceOfficerController } from "../controllers/attendance-officer.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createBursarSchema as createStaffAccountSchema } from "../validations/bursar.validation";

const router = Router();

router.use(authMiddleware(["SchoolAdmin"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Attendance Officers
 *   description: Support staff who can scan any student's ID card to record attendance
 */

/**
 * @swagger
 * /api/attendance-officer:
 *   get:
 *     summary: List the school's attendance officers (SchoolAdmin)
 *     tags: [Attendance Officers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance officers retrieved
 *   post:
 *     summary: Create an attendance officer account (SchoolAdmin)
 *     tags: [Attendance Officers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance officer created
 */
router.get("/", AttendanceOfficerController.getOfficers);
router.post("/", validateBody(createStaffAccountSchema), AttendanceOfficerController.createOfficer);

/**
 * @swagger
 * /api/attendance-officer/{id}:
 *   delete:
 *     summary: Remove an attendance officer account (SchoolAdmin)
 *     tags: [Attendance Officers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance officer removed
 */
router.delete("/:id", AttendanceOfficerController.deleteOfficer);

export default router;
