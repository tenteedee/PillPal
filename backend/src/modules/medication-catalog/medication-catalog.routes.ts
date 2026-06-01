import { Router } from 'express';

import { requireAuth } from '../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import {
  createMedicationCatalogBodySchema,
  updateMedicationCatalogBodySchema,
} from './medication-catalog.schema.js';
import { medicationCatalogController } from './medication-catalog.controller.js';

const medicationCatalogRouter = Router();
medicationCatalogRouter.use(requireAuth);

/**
 * @openapi
 * /medication-catalogs:
 *   get:
 *     tags:
 *       - Medication Catalog
 *     summary: List medication catalogs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
medicationCatalogRouter.get('/', medicationCatalogController.list);

/**
 * @openapi
 * /medication-catalogs/search:
 *   get:
 *     tags:
 *       - Medication Catalog
 *     summary: Search medication catalog by name or active ingredient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 */
medicationCatalogRouter.get('/search', medicationCatalogController.search);

/**
 * @openapi
 * /medication-catalogs:
 *   post:
 *     tags:
 *       - Medication Catalog
 *     summary: Create medication catalog item
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
 *               name: { type: string }
 *               activeIngredient: { type: string }
 *               strength: { type: string }
 *               dosageForm: { type: string }
 *               manufacturer: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
medicationCatalogRouter.post(
  '/',
  validateBody(createMedicationCatalogBodySchema),
  medicationCatalogController.create,
);

/**
 * @openapi
 * /medication-catalogs/{id}:
 *   get:
 *     tags:
 *       - Medication Catalog
 *     summary: Get medication catalog by id
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
medicationCatalogRouter.get('/:id', medicationCatalogController.getById);

/**
 * @openapi
 * /medication-catalogs/{id}:
 *   put:
 *     tags:
 *       - Medication Catalog
 *     summary: Update medication catalog by id
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
 *               name: { type: string }
 *               activeIngredient: { type: string }
 *               strength: { type: string }
 *               dosageForm: { type: string }
 *               manufacturer: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
medicationCatalogRouter.put(
  '/:id',
  validateBody(updateMedicationCatalogBodySchema),
  medicationCatalogController.updateById,
);

/**
 * @openapi
 * /medication-catalogs/{id}:
 *   delete:
 *     tags:
 *       - Medication Catalog
 *     summary: Delete medication catalog by id
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
medicationCatalogRouter.delete('/:id', medicationCatalogController.deleteById);

export { medicationCatalogRouter };
