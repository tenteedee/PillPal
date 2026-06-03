import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { scheduleController } from './schedule.controller.js';
import {
  createScheduleBodySchema,
  updateScheduleBodySchema,
} from './schedule.schema.js';

const scheduleRouter = Router();
scheduleRouter.use(requireAuth);

/**
 * @openapi
 * /schedules:
 *   get:
 *     tags:
 *       - Schedule
 *     summary: List current user medication schedules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userMedicationId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional user medication filter
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
scheduleRouter.get('/', scheduleController.list);

/**
 * @openapi
 * /schedules:
 *   post:
 *     tags:
 *       - Schedule
 *     summary: Create medication schedule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userMedicationId, doseAmount, times, timesPerDay]
 *             properties:
 *               userMedicationId: { type: string, format: uuid }
 *               doseAmount: { type: string }
 *               times:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "08:00"
 *               timesPerDay: { type: integer }
 *               minIntervalHours: { type: integer, nullable: true }
 *               instruction: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created
 */
scheduleRouter.post(
  '/',
  validateBody(createScheduleBodySchema),
  scheduleController.create,
);

/**
 * @openapi
 * /schedules/{id}:
 *   get:
 *     tags:
 *       - Schedule
 *     summary: Get medication schedule by id
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
 *       404:
 *         description: Not found
 */
scheduleRouter.get('/:id', scheduleController.getById);

/**
 * @openapi
 * /schedules/{id}:
 *   put:
 *     tags:
 *       - Schedule
 *     summary: Replace medication schedule by id
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
 *             required:
 *               - userMedicationId
 *               - doseAmount
 *               - times
 *               - timesPerDay
 *               - minIntervalHours
 *               - instruction
 *               - isActive
 *             properties:
 *               userMedicationId: { type: string, format: uuid }
 *               doseAmount: { type: string }
 *               times:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "08:00"
 *               timesPerDay: { type: integer }
 *               minIntervalHours: { type: integer, nullable: true }
 *               instruction: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
scheduleRouter.put(
  '/:id',
  validateBody(updateScheduleBodySchema),
  scheduleController.updateById,
);

/**
 * @openapi
 * /schedules/{id}/pause:
 *   put:
 *     tags:
 *       - Schedule
 *     summary: Pause medication schedule by id
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
 *       404:
 *         description: Not found
 */
scheduleRouter.put('/:id/pause', scheduleController.pauseById);

/**
 * @openapi
 * /schedules/{id}:
 *   delete:
 *     tags:
 *       - Schedule
 *     summary: Delete medication schedule by id
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
 *       404:
 *         description: Not found
 */
scheduleRouter.delete('/:id', scheduleController.deleteById);

export { scheduleRouter };
