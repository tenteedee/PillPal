import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { aiController } from './ai.controller.js';
import {
  confirmMedicationScanBodySchema,
  scanMedicationBodySchema,
} from './ai.schema.js';

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

/**
 * @openapi
 * /ai/scan-medication/{scanAttemptId}/confirm:
 *   post:
 *     tags:
 *       - AI
 *     summary: Confirm a scanned medication and resolve it to a user medication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanAttemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [type, userMedicationId]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [existing_user_medication]
 *                   userMedicationId:
 *                     type: string
 *                     format: uuid
 *               - type: object
 *                 required: [type, catalogId]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [catalog_medication]
 *                   catalogId:
 *                     type: string
 *                     format: uuid
 *                   saveToUserMedications:
 *                     type: boolean
 *                     enum: [true]
 *                   note:
 *                     type: string
 *               - type: object
 *                 required: [type, name]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [manual_unverified]
 *                   name:
 *                     type: string
 *                   activeIngredient:
 *                     type: string
 *                   strength:
 *                     type: string
 *                   dosageForm:
 *                     type: string
 *                   note:
 *                     type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile, scan attempt, medication, or catalog not found
 */
aiRouter.post(
  '/scan-medication/:scanAttemptId/confirm',
  validateBody(confirmMedicationScanBodySchema),
  aiController.confirmMedicationScan,
);

export { aiRouter };
