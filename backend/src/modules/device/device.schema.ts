import { z } from "zod";

export const registerPushTokenBodySchema = z
  .object({
    expoPushToken: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(
        /^Expo(nent)?PushToken\[[^\]]+\]$/,
        "Expected a valid Expo push token",
      ),
    deviceId: z.string().trim().min(1).max(255).nullable().optional(),
    platform: z.enum(["ios", "android", "web"]),
  })
  .strict();

export type RegisterPushTokenBody = z.infer<typeof registerPushTokenBodySchema>;
