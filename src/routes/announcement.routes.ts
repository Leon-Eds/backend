import { Router } from "express";
import { AnnouncementController } from "../controllers/announcement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createAnnouncementSchema } from "../validations/announcement.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: API for managing school announcements and communications
 */

/**
 * @swagger
 * /api/announcement:
 *   get:
 *     summary: Get all announcements for the school
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: audience
 *         schema:
 *           type: string
 *           enum: [All, Students, Teachers, Class]
 *         description: Filter by audience type
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *         description: Set to "true" to return all announcements without pagination
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of announcements
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware(), AnnouncementController.getAll);

/**
 * @swagger
 * /api/announcement/{id}:
 *   get:
 *     summary: Get a single announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement details
 *       404:
 *         description: Not found
 */
router.get("/:id", authMiddleware(), AnnouncementController.getById);

/**
 * @swagger
 * /api/announcement:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [All, Students, Teachers, Class]
 *               targetClassId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", authMiddleware(["SchoolAdmin"]), validateBody(createAnnouncementSchema), AnnouncementController.create);

/**
 * @swagger
 * /api/announcement/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", authMiddleware(["SchoolAdmin"]), AnnouncementController.delete);

export default router;
