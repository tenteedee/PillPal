import { z } from "zod";

export const scanMedicationBodySchema = z
  .object({
    staticId: z.string().uuid(),
  })
  .strict();

const optionalTextSchema = z.string().trim().min(1).max(255).optional();

export const confirmMedicationScanBodySchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("existing_user_medication"),
      userMedicationId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      type: z.literal("catalog_medication"),
      catalogId: z.string().uuid(),
      saveToUserMedications: z.literal(true).default(true),
      note: z.string().trim().min(1).max(1000).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("manual_unverified"),
      name: z.string().trim().min(1).max(255),
      activeIngredient: optionalTextSchema,
      strength: z.string().trim().min(1).max(100).optional(),
      dosageForm: z.string().trim().min(1).max(100).optional(),
      note: z.string().trim().min(1).max(1000).optional(),
    })
    .strict(),
]);

export type ScanMedicationBody = z.infer<typeof scanMedicationBodySchema>;
export type ConfirmMedicationScanBody = z.infer<
  typeof confirmMedicationScanBodySchema
>;
