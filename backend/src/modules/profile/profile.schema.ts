import { z } from "zod";
import {
  ALLERGY_TYPE_VALUES,
  ACCESSIBILITY_MODE,
  ACCESSIBILITY_MODE_VALUES,
} from "../../shared/constants/enums/profile.js";

const conditionSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
});

const allergySchema = z.object({
  type: z.enum(ALLERGY_TYPE_VALUES),
  name: z.string().min(1),
  label: z.string().min(1),
});

export const createProfileBodySchema = z.object({
  fullName: z.string().min(1).max(255),
  ageGroup: z.string().min(1).max(50).optional(),
  accessibilityMode: z
    .enum(ACCESSIBILITY_MODE_VALUES)
    .default(ACCESSIBILITY_MODE.NORMAL),
  conditions: z.array(conditionSchema).default([]),
  allergies: z.array(allergySchema).default([]),
  doctorNote: z.string().max(1000).optional(),
  caregiverName: z.string().max(255).optional(),
  caregiverPhone: z.string().max(50).optional(),
});

export const updateProfileBodySchema = createProfileBodySchema.partial();

export type CreateProfileBody = z.infer<typeof createProfileBodySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
