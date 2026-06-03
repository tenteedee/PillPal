import { z } from "zod";

import { paginationInputSchema } from "../../shared/types/pagination.js";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected time in HH:mm format");

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const scheduleListFilterSchema = z.object({
  userMedicationId: z.string().uuid().optional(),
  active: booleanQuerySchema.optional(),
});

export const scheduleGetListInputSchema = paginationInputSchema
  .merge(scheduleListFilterSchema)
  .strict();

export const createScheduleBodySchema = z
  .object({
    userMedicationId: z.string().uuid(),
    doseAmount: z.string().trim().min(1).max(100),
    times: z.array(timeSchema).min(1).max(12),
    timesPerDay: z.number().int().min(1).max(12),
    minIntervalHours: z.number().int().min(1).max(24).nullable().optional(),
    instruction: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .refine((value) => value.timesPerDay === value.times.length, {
    message: "timesPerDay must match times length",
    path: ["timesPerDay"],
  });

export const updateScheduleBodySchema = z
  .object({
    userMedicationId: z.string().uuid(),
    doseAmount: z.string().trim().min(1).max(100),
    times: z.array(timeSchema).min(1).max(12),
    timesPerDay: z.number().int().min(1).max(12),
    minIntervalHours: z.number().int().min(1).max(24).nullable(),
    instruction: z.string().trim().max(1000).nullable(),
    isActive: z.boolean(),
  })
  .strict()
  .refine((value) => value.timesPerDay === value.times.length, {
    message: "timesPerDay must match times length",
    path: ["timesPerDay"],
  });

export type CreateScheduleBody = z.infer<typeof createScheduleBodySchema>;
export type UpdateScheduleBody = z.infer<typeof updateScheduleBodySchema>;
export type ScheduleGetListInput = z.infer<typeof scheduleGetListInputSchema>;
