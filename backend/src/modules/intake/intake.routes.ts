import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { intakeController } from "./intake.controller.js";
import { createIntakeBodySchema } from "./intake.schema.js";

const intakeRouter = Router();
intakeRouter.use(requireAuth);

/**
 * @openapi
 * /intakes:
 *   get:
 *     tags:
 *       - Intake
 *     summary: List current user's intake history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userMedicationId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: scheduleId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [taken, missed, skipped, blocked_attempt]
 *       - in: query
 *         name: takenFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: takenTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: OK
 */
intakeRouter.get("/", intakeController.list);

/**
 * @openapi
 * /intakes/today:
 *   get:
 *     tags:
 *       - Intake
 *     summary: List today's current user intake events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
intakeRouter.get("/today", intakeController.listToday);

/**
 * @openapi
 * /intakes:
 *   post:
 *     tags:
 *       - Intake
 *     summary: Confirm that the current user took a medication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userMedicationId, safetyCheckEventId]
 *             properties:
 *               userMedicationId: { type: string, format: uuid }
 *               scheduleId: { type: string, format: uuid, nullable: true }
 *               scheduledTime:
 *                 type: string
 *                 nullable: true
 *                 example: "08:00"
 *               doseAmount:
 *                 type: string
 *                 nullable: true
 *                 example: "1 tablet"
 *               safetyCheckEventId: { type: string, format: uuid }
 *               confirmedAfterWarning: { type: boolean }
 *               takenAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile, medication, schedule, or safety check not found
 *       409:
 *         description: Safety check is blocked and cannot be confirmed
 */
intakeRouter.post(
  "/",
  validateBody(createIntakeBodySchema),
  intakeController.create,
);

export { intakeRouter };
