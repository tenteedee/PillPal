import { z } from "zod";

import { paginationInputSchema } from "../../shared/types/pagination.js";

const notificationEventStatusSchema = z.enum([
  "pending",
  "sent",
  "failed",
  "cancelled",
]);

const notificationEventTypeSchema = z.enum([
  "safety_blocked",
  "safety_warning",
  "intake_confirmed",
  "intake_confirmed_after_warning",
  "dose_missed",
  "scan_unknown_medicine",
  "test",
]);

export const notificationListInputSchema = paginationInputSchema
  .merge(
    z.object({
      status: notificationEventStatusSchema.optional(),
      eventType: notificationEventTypeSchema.optional(),
    }),
  )
  .strict();

export type NotificationListInput = z.infer<typeof notificationListInputSchema>;

export type CreateNotificationEventInput = {
  patientProfileId: string | null;
  recipientProfileId: string;
  eventType: z.infer<typeof notificationEventTypeSchema>;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
};
