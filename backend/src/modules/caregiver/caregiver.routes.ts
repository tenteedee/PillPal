import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { caregiverController } from "./caregiver.controller.js";
import { inviteCaregiverBodySchema } from "./caregiver.schema.js";

const caregiverRouter = Router();
caregiverRouter.use(requireAuth);

/**
 * @openapi
 * /caregivers:
 *   get:
 *     tags:
 *       - Caregiver
 *     summary: List current patient's caregiver links
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
caregiverRouter.get("/", caregiverController.listCaregivers);

/**
 * @openapi
 * /caregivers/invite:
 *   post:
 *     tags:
 *       - Caregiver
 *     summary: Invite caregiver profile to current patient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [caregiverProfileId]
 *             properties:
 *               caregiverProfileId: { type: string, format: uuid }
 *               relationship: { type: string, nullable: true }
 *               permissions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
 */
caregiverRouter.post(
  "/invite",
  validateBody(inviteCaregiverBodySchema),
  caregiverController.invite,
);

/**
 * @openapi
 * /caregivers/invitations:
 *   get:
 *     tags:
 *       - Caregiver
 *     summary: List pending patient invitations for current caregiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
caregiverRouter.get("/invitations", caregiverController.listInvitations);

/**
 * @openapi
 * /caregivers/patients:
 *   get:
 *     tags:
 *       - Caregiver
 *     summary: List accepted patients for current caregiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
caregiverRouter.get("/patients", caregiverController.listPatients);

/**
 * @openapi
 * /caregivers/{id}/accept:
 *   put:
 *     tags:
 *       - Caregiver
 *     summary: Accept caregiver invitation
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
caregiverRouter.put("/:id/accept", caregiverController.accept);

/**
 * @openapi
 * /caregivers/{id}:
 *   delete:
 *     tags:
 *       - Caregiver
 *     summary: Revoke caregiver patient link
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
caregiverRouter.delete("/:id", caregiverController.revoke);

export { caregiverRouter };
