import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { safetyController } from './safety.controller.js';
import { safetyCheckBodySchema } from './safety.schema.js';

const safetyRouter = Router();
safetyRouter.use(requireAuth);

/**
 * @openapi
 * /safety/check:
 *   post:
 *     tags:
 *       - Safety
 *     summary: Run deterministic pre-intake safety check
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userMedicationId]
 *             properties:
 *               userMedicationId: { type: string, format: uuid }
 *               scheduleId: { type: string, format: uuid, nullable: true }
 *               scheduledTime:
 *                 type: string
 *                 nullable: true
 *                 example: "08:00"
 *               source:
 *                 type: string
 *                 enum: [manual, today_plan, scan]
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile or medication not found
 */
safetyRouter.post(
  '/check',
  validateBody(safetyCheckBodySchema),
  safetyController.check,
);

export { safetyRouter };
