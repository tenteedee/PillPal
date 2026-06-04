import { z } from "zod";

import { paginationInputSchema } from "../../shared/types/pagination.js";

export const medicineLookupStatusSchema = z.enum([
  "pending",
  "in_progress",
  "needs_admin_review",
  "verified",
  "rejected",
  "failed",
]);

export const medicineDataSourceTypeSchema = z.enum([
  "distributor",
  "administration",
  "general_web",
]);

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const medicineLookupListInputSchema = paginationInputSchema
  .merge(
    z.object({
      status: medicineLookupStatusSchema.optional(),
      queryName: z.string().trim().min(1).max(255).optional(),
    }),
  )
  .strict();

export const medicineDataSourceListInputSchema = paginationInputSchema
  .merge(
    z.object({
      sourceType: medicineDataSourceTypeSchema.optional(),
      active: booleanQuerySchema.optional(),
    }),
  )
  .strict();

export type MedicineLookupListInput = z.infer<
  typeof medicineLookupListInputSchema
>;

export type MedicineDataSourceListInput = z.infer<
  typeof medicineDataSourceListInputSchema
>;
