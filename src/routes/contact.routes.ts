import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";
import { createRateLimiter } from "../middlewares/security.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { contactQuerySchema } from "../validations/contact.validation";

const router = Router();
const contactLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "contact-query",
});

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Public landing-page enquiries
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a school demo request to the LeonEd team
 *     tags: [Contact]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, schoolName]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 150
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 maxLength: 30
 *               schoolName:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 5000
 *               website:
 *                 type: string
 *                 description: Honeypot field; leave empty and hide it from users
 *     responses:
 *       200:
 *         description: Demo request received
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Too many requests
 */
router.post("/", contactLimit, validateBody(contactQuerySchema), ContactController.submit);

export default router;
