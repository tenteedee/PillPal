import { z } from 'zod';

export const signUpBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type SignUpBody = z.infer<typeof signUpBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
