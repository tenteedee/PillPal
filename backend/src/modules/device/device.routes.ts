import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { deviceController } from "./device.controller.js";
import { registerPushTokenBodySchema } from "./device.schema.js";

const deviceRouter = Router();
deviceRouter.use(requireAuth);

/**
 * @openapi
 * /devices/push-token:
 *   post:
 *     tags:
 *       - Device
 *     summary: Register or refresh current user's Expo push token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expoPushToken, platform]
 *             properties:
 *               expoPushToken: { type: string }
 *               deviceId: { type: string, nullable: true }
 *               platform: { type: string, enum: [ios, android, web] }
 *     responses:
 *       200:
 *         description: OK
 */
deviceRouter.post(
  "/push-token",
  validateBody(registerPushTokenBodySchema),
  deviceController.registerPushToken,
);

/**
 * @openapi
 * /devices/push-tokens:
 *   get:
 *     tags:
 *       - Device
 *     summary: List current user's active push tokens
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
deviceRouter.get("/push-tokens", deviceController.listPushTokens);

/**
 * @openapi
 * /devices/push-token/{id}:
 *   delete:
 *     tags:
 *       - Device
 *     summary: Deactivate current user's push token
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
 */
deviceRouter.delete("/push-token/:id", deviceController.deactivatePushToken);

export { deviceRouter };
