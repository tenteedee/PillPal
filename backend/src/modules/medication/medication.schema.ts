import { z } from 'zod';

export const createMedicationBodySchema = z.object({
  catalogId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  activeIngredient: z.string().max(255).optional(),
  strength: z.string().max(100).optional(),
  dosageForm: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  imageUrl: z.string().url().max(2048).optional(),
});

export const updateMedicationBodySchema = z.object({
  catalogId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  activeIngredient: z.string().max(255).optional(),
  strength: z.string().max(100).optional(),
  dosageForm: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  imageUrl: z.string().url().max(2048).optional(),
  isActive: z.boolean().optional(),
});

export type CreateMedicationBody = z.infer<typeof createMedicationBodySchema>;
export type UpdateMedicationBody = z.infer<typeof updateMedicationBodySchema>;
