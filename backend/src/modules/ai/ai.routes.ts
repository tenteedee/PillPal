import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { aiController } from './ai.controller.js';
import { scanMedicationBodySchema } from './ai.schema.js';

const aiRouter = Router();
aiRouter.use(requireAuth);

/**
 * @openapi
 * /ai/scan-medication:
 *   post:
 *     tags:
 *       - AI
 *     summary: Extract and match medication candidates from uploaded image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staticId]
 *             properties:
 *               staticId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile or static file not found
 */
aiRouter.post(
  '/scan-medication',
  validateBody(scanMedicationBodySchema),
  aiController.scanMedication,
);

export { aiRouter };
