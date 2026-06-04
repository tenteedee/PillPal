import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { notificationController } from "./notification.controller.js";

const notificationRouter = Router();
notificationRouter.use(requireAuth);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags:
 *       - Notification
 *     summary: List current user's notification events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, cancelled]
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
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
notificationRouter.get("/", notificationController.list);

/**
 * @openapi
 * /notifications/{id}:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get current user's notification event by id
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
 *         description: Notification not found
 */
notificationRouter.get("/:id", notificationController.getById);

export { notificationRouter };
