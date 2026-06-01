import { z } from 'zod';

export const createMedicationCatalogBodySchema = z.object({
  name: z.string().min(1).max(255),
  activeIngredient: z.string().max(255).optional(),
  strength: z.string().max(100).optional(),
  dosageForm: z.string().max(100).optional(),
  manufacturer: z.string().max(255).optional(),
});

export const updateMedicationCatalogBodySchema = createMedicationCatalogBodySchema;

export type CreateMedicationCatalogBody = z.infer<
  typeof createMedicationCatalogBodySchema
>;
export type UpdateMedicationCatalogBody = z.infer<
  typeof updateMedicationCatalogBodySchema
>;
