import { z } from "zod";

import { paginationInputSchema } from "../../shared/types/pagination.js";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected time in HH:mm format");

const intakeStatusSchema = z.enum([
  "taken",
  "missed",
  "skipped",
  "blocked_attempt",
]);

export const createIntakeBodySchema = z
  .object({
    userMedicationId: z.string().uuid(),
    scheduleId: z.string().uuid().nullable().optional(),
    scheduledTime: timeSchema.nullable().optional(),
    doseAmount: z.string().trim().min(1).max(100).nullable().optional(),
    safetyCheckEventId: z.string().uuid(),
    confirmedAfterWarning: z.boolean().optional(),
    takenAt: z.string().datetime().optional(),
  })
  .strict();

export const intakeListInputSchema = paginationInputSchema
  .merge(
    z.object({
      userMedicationId: z.string().uuid().optional(),
      scheduleId: z.string().uuid().optional(),
      status: intakeStatusSchema.optional(),
      takenFrom: z.string().datetime().optional(),
      takenTo: z.string().datetime().optional(),
    }),
  )
  .strict()
  .refine(
    (value) =>
      !value.takenFrom ||
      !value.takenTo ||
      new Date(value.takenFrom).getTime() <= new Date(value.takenTo).getTime(),
    {
      message: "takenFrom must be before or equal to takenTo",
      path: ["takenFrom"],
    },
  );

export type CreateIntakeBody = z.infer<typeof createIntakeBodySchema>;
export type IntakeListInput = z.infer<typeof intakeListInputSchema>;
