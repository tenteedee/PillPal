import { z } from "zod";

export const dailyPlanQuerySchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format")
      .optional(),
  })
  .strict();

export type DailyPlanQuery = z.infer<typeof dailyPlanQuerySchema>;
