import { Router } from "express";

import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { medicineLookupController } from "./medicine-lookup.controller.js";
import { saveLookupMedicationBodySchema } from "./medicine-lookup.schema.js";

const medicineLookupRouter = Router();
medicineLookupRouter.use(requireAuth);

/**
 * @openapi
 * /medicine-lookups:
 *   get:
 *     tags:
 *       - Medicine Lookup
 *     summary: List current user's unknown medicine lookup attempts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, needs_admin_review, verified, rejected, failed]
 *       - in: query
 *         name: queryName
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
medicineLookupRouter.get("/", medicineLookupController.list);

/**
 * @openapi
 * /medicine-lookups/sources:
 *   get:
 *     tags:
 *       - Medicine Lookup
 *     summary: List configured medicine data sources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sourceType
 *         schema:
 *           type: string
 *           enum: [distributor, administration, general_web]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
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
medicineLookupRouter.get("/sources", medicineLookupController.listSources);

/**
 * @openapi
 * /medicine-lookups/{id}/run:
 *   post:
 *     tags:
 *       - Medicine Lookup
 *     summary: Run the unknown medicine lookup orchestrator
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
 *         description: Medicine lookup not found
 */
medicineLookupRouter.post("/:id/run", medicineLookupController.runById);

/**
 * @openapi
 * /medicine-lookups/{id}/save-medication:
 *   post:
 *     tags:
 *       - Medicine Lookup
 *     summary: Save a verified external lookup candidate as a user medication
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               externalCandidateId:
 *                 type: string
 *                 format: uuid
 *               note:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Lookup is not verified or has no authorized candidate
 *       404:
 *         description: Medicine lookup not found
 */
medicineLookupRouter.post(
  "/:id/save-medication",
  validateBody(saveLookupMedicationBodySchema),
  medicineLookupController.saveMedicationById,
);

/**
 * @openapi
 * /medicine-lookups/{id}:
 *   get:
 *     tags:
 *       - Medicine Lookup
 *     summary: Get current user's medicine lookup attempt detail
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
 *         description: Medicine lookup not found
 */
medicineLookupRouter.get("/:id", medicineLookupController.getById);

export { medicineLookupRouter };
