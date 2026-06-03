import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import {
  createMedicationBodySchema,
  updateMedicationBodySchema,
} from './medication.schema.js';
import { medicationController } from './medication.controller.js';

const medicationRouter = Router();
medicationRouter.use(requireAuth);

/**
 * @openapi
 * /medications:
 *   get:
 *     tags:
 *       - Medication
 *     summary: List current user medications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Optional medication name filter
 *       - in: query
 *         name: activeIngredient
 *         schema:
 *           type: string
 *         description: Optional active ingredient filter
 *       - in: query
 *         name: strength
 *         schema:
 *           type: string
 *         description: Optional strength filter
 *       - in: query
 *         name: dosageForm
 *         schema:
 *           type: string
 *         description: Optional dosage form filter
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Optional active filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
medicationRouter.get('/', medicationController.list);

/**
 * @openapi
 * /medications:
 *   post:
 *     tags:
 *       - Medication
 *     summary: Create user medication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               catalogId: { type: string, format: uuid, nullable: true }
 *               name: { type: string }
 *               activeIngredient: { type: string }
 *               strength: { type: string }
 *               dosageForm: { type: string }
 *               note: { type: string }
 *               imageUrl: { type: string, format: uri }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
medicationRouter.post(
  '/',
  validateBody(createMedicationBodySchema),
  medicationController.create,
);

/**
 * @openapi
 * /medications/{id}:
 *   get:
 *     tags:
 *       - Medication
 *     summary: Get user medication by id
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
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
medicationRouter.get('/:id', medicationController.getById);

/**
 * @openapi
 * /medications/{id}:
 *   put:
 *     tags:
 *       - Medication
 *     summary: Update user medication by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               catalogId: { type: string, format: uuid, nullable: true }
 *               name: { type: string }
 *               activeIngredient: { type: string }
 *               strength: { type: string }
 *               dosageForm: { type: string }
 *               note: { type: string }
 *               imageUrl: { type: string, format: uri }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
medicationRouter.put(
  '/:id',
  validateBody(updateMedicationBodySchema),
  medicationController.updateById,
);

/**
 * @openapi
 * /medications/{id}/stop:
 *   put:
 *     tags:
 *       - Medication
 *     summary: Mark user medication as inactive
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
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
medicationRouter.put('/:id/stop', medicationController.stopById);

/**
 * @openapi
 * /medications/{id}:
 *   delete:
 *     tags:
 *       - Medication
 *     summary: Delete user medication by id
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
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
medicationRouter.delete('/:id', medicationController.deleteById);

export { medicationRouter };
