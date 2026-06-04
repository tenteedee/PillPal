import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { medicineLookupController } from "./medicine-lookup.controller.js";

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
