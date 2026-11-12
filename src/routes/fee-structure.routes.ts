import { Router } from "express";
import { FeeStructureController } from "../controllers/fee-structure.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  setStudentCustomFeesSchema,
} from "../validations/fee-structure.validation";

const router = Router();

/**
 * @swagger
 * /api/fee-structure/my-fees:
 *   get:
 *     summary: The fees that apply to the authenticated student, with their total
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student fees retrieved
 */
// Registered before the admin/bursar guard below so students can read their own fees
router.get("/my-fees", authMiddleware(["Student"]), requireSchoolId, FeeStructureController.getMyFees);

// Everything else (fee setup and totals) is for the school admin and bursar
router.use(authMiddleware(["SchoolAdmin", "Bursar"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Fee Structures
 *   description: Per-term fees a school charges (base fees by class level, custom fees by student)
 */

/**
 * @swagger
 * /api/fee-structure:
 *   get:
 *     summary: List the school's fee structures
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee structures retrieved
 *   post:
 *     summary: Create a fee structure
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, amount, type]
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [base, custom]
 *               applicableLevels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Class names (e.g. "JSS 1") or "All"; base fees only
 *     responses:
 *       201:
 *         description: Fee structure created
 */
router.get("/", FeeStructureController.getStructures);
router.post("/", validateBody(createFeeStructureSchema), FeeStructureController.createStructure);

/**
 * @swagger
 * /api/fee-structure/term-summary:
 *   get:
 *     summary: Expected, collected and outstanding fee totals for a term (defaults to the current term)
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Term fee summary retrieved
 */
router.get("/term-summary", FeeStructureController.getTermSummary);

/**
 * @swagger
 * /api/fee-structure/student-custom-fees:
 *   get:
 *     summary: Map of studentId to assigned custom fee structure IDs
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student custom fees retrieved
 */
router.get("/student-custom-fees", FeeStructureController.getStudentCustomFees);

/**
 * @swagger
 * /api/fee-structure/student-custom-fees/{studentId}:
 *   put:
 *     summary: Replace the custom fees assigned to a student
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feeStructureIds]
 *             properties:
 *               feeStructureIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Student custom fees updated
 */
router.put("/student-custom-fees/:studentId", validateBody(setStudentCustomFeesSchema), FeeStructureController.setStudentCustomFees);

/**
 * @swagger
 * /api/fee-structure/{id}:
 *   put:
 *     summary: Update a fee structure
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee structure updated
 *   delete:
 *     summary: Delete a fee structure (also removes its student assignments)
 *     tags: [Fee Structures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee structure deleted
 */
router.put("/:id", validateBody(updateFeeStructureSchema), FeeStructureController.updateStructure);
router.delete("/:id", FeeStructureController.deleteStructure);

export default router;
