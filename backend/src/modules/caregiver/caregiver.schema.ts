import { z } from "zod";

export const caregiverLinkPermissionsSchema = z
  .object({
    notifySafetyWarnings: z.boolean().default(true),
    notifyBlockedAttempts: z.boolean().default(true),
    notifyMissedDose: z.boolean().default(true),
    notifyMedicationReminders: z.boolean().default(true),
    notifyIntakeConfirmations: z.boolean().default(true),
    viewMedicationList: z.boolean().default(false),
    viewIntakeHistory: z.boolean().default(false),
  })
  .strict();

export const inviteCaregiverBodySchema = z
  .object({
    caregiverProfileId: z.string().uuid(),
    relationship: z.string().trim().min(1).max(100).nullable().optional(),
    permissions: caregiverLinkPermissionsSchema.optional(),
  })
  .strict();

export type InviteCaregiverBody = z.infer<typeof inviteCaregiverBodySchema>;
