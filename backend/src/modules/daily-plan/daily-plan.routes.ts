import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { dailyPlanController } from './daily-plan.controller.js';

const dailyPlanRouter = Router();
dailyPlanRouter.use(requireAuth);

/**
 * @openapi
 * /daily-plan/today:
 *   get:
 *     tags:
 *       - Daily Plan
 *     summary: Get today's medication plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional local date in YYYY-MM-DD format. Defaults to app timezone today.
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
dailyPlanRouter.get('/today', dailyPlanController.today);

export { dailyPlanRouter };
