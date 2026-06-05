import { z } from "zod";

export const saveMedicineLookupBodySchema = z
  .object({
    externalCandidateId: z.string().uuid().optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export type SaveMedicineLookupBody = z.infer<
  typeof saveMedicineLookupBodySchema
>;
