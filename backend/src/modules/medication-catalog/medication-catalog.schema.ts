import { z } from 'zod';

const jsonArraySchema = z.array(z.unknown());

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
