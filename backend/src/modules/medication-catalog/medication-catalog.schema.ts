import { z } from 'zod';

import { paginationInputSchema } from '../../shared/types/pagination.js';

const jsonArraySchema = z.array(z.unknown());

export const medicationCatalogListFilterSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  activeIngredient: z.string().trim().min(1).max(255).optional(),
  dosageForm: z.string().trim().min(1).max(100).optional(),
  manufacturer: z.string().trim().min(1).max(255).optional(),
});

export const medicationCatalogGetListInputSchema = paginationInputSchema.merge(
  medicationCatalogListFilterSchema,
).strict();

export const medicationCatalogSearchInputSchema =
  medicationCatalogGetListInputSchema.extend({
    name: z.string().trim().min(1).max(255),
  });

export const createMedicationCatalogBodySchema = z.object({
  name: z.string().min(1).max(255),
  activeIngredient: z.string().max(255).optional(),
  strength: z.string().max(100).optional(),
  dosageForm: z.string().max(100).optional(),
  manufacturer: z.string().max(255).optional(),
  ingredients: jsonArraySchema.optional(),
  route: z.string().max(100).optional(),
  description: z.string().max(3000).optional(),
  commonUses: jsonArraySchema.optional(),
  warnings: jsonArraySchema.optional(),
  contraindications: jsonArraySchema.optional(),
  sideEffects: jsonArraySchema.optional(),
  interactionNotes: jsonArraySchema.optional(),
});

export const updateMedicationCatalogBodySchema = createMedicationCatalogBodySchema;

export type CreateMedicationCatalogBody = z.infer<
  typeof createMedicationCatalogBodySchema
>;
export type UpdateMedicationCatalogBody = z.infer<
  typeof updateMedicationCatalogBodySchema
>;
export type MedicationCatalogGetListInput = z.infer<
  typeof medicationCatalogGetListInputSchema
>;
export type MedicationCatalogSearchInput = z.infer<
  typeof medicationCatalogSearchInputSchema
>;
