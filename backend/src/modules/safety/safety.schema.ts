import { z } from "zod";

export const safetyCheckBodySchema = z
  .object({
    userMedicationId: z.string().uuid(),
    scheduleId: z.string().uuid().nullable().optional(),
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected time in HH:mm format")
      .nullable()
      .optional(),
    source: z.enum(["manual", "today_plan", "scan"]).default("manual"),
  })
  .strict();

export type SafetyCheckBody = z.infer<typeof safetyCheckBodySchema>;
