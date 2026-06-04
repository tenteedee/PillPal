import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('medication-images'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  APP_TIMEZONE: z.string().default('Asia/Ho_Chi_Minh'),
  ENABLE_MOCK_AI_SCAN: z
    .string()
    .optional()
    .transform((value) => value === 'true')
    .pipe(z.boolean())
    .catch(true),
  DEMO_PROFILE_ID: z.string().uuid().optional(),
  ENABLE_DEMO_AUTH: z
    .string()
    .optional()
    .transform((value) => value === 'true')
    .pipe(z.boolean())
    .catch(false),
});

export const env = envSchema.parse(process.env);
