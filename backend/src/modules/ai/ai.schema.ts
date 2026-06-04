import { z } from "zod";

export const scanMedicationBodySchema = z
  .object({
    staticId: z.string().uuid(),
  })
  .strict();

export type ScanMedicationBody = z.infer<typeof scanMedicationBodySchema>;
