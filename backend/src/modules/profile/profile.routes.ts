import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { profileController } from "./profile.controller.js";
import {
  createProfileBodySchema,
  updateProfileBodySchema,
} from "./profile.schema.js";

const profileRouter = Router();
profileRouter.use(requireAuth);

/**
 * @openapi
 * /profiles/me:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRouter.get("/me", profileController.getMe);

/**
 * @openapi
 * /profiles:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Create current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName: { type: string }
 *               ageGroup: { type: string }
 *               accessibilityMode: { type: string, enum: [normal, elderly, low_vision, simple] }
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, label]
 *                   properties:
 *                     name: { type: string }
 *                     label: { type: string }
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [type, name, label]
 *                   properties:
 *                     type: { type: string, enum: [ingredient, medication] }
 *                     name: { type: string }
 *                     label: { type: string }
 *               doctorNote: { type: string }
 *               caregiverName: { type: string }
 *               caregiverPhone: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRouter.post(
  "/",
  validateBody(createProfileBodySchema),
  profileController.create,
);

/**
 * @openapi
 * /profiles/me:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               ageGroup: { type: string }
 *               accessibilityMode: { type: string, enum: [normal, elderly, low_vision, simple] }
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, label]
 *                   properties:
 *                     name: { type: string }
 *                     label: { type: string }
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [type, name, label]
 *                   properties:
 *                     type: { type: string, enum: [ingredient, medication] }
 *                     name: { type: string }
 *                     label: { type: string }
 *               doctorNote: { type: string }
 *               caregiverName: { type: string }
 *               caregiverPhone: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRouter.put(
  "/me",
  validateBody(updateProfileBodySchema),
  profileController.updateMe,
);

export { profileRouter };
