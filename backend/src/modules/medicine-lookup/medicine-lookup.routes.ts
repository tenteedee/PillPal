import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { medicineLookupController } from "./medicine-lookup.controller.js";
import { saveMedicineLookupBodySchema } from "./medicine-lookup.schema.js";

const medicineLookupRouter = Router();
medicineLookupRouter.use(requireAuth);

/**
 * @openapi
 * /medicine-lookups/{id}/run:
 *   post:
 *     tags:
 *       - Medicine Lookup
 *     summary: Run external verification for an unknown scanned medicine
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
medicineLookupRouter.post("/:id/run", medicineLookupController.run);

/**
 * @openapi
 * /medicine-lookups/{id}/save-medication:
 *   post:
 *     tags:
 *       - Medicine Lookup
 *     summary: Save a verified external lookup candidate as user medication
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
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Lookup is not verified or candidate is not saveable
 */
medicineLookupRouter.post(
  "/:id/save-medication",
  validateBody(saveMedicineLookupBodySchema),
  medicineLookupController.saveMedication,
);

export { medicineLookupRouter };
