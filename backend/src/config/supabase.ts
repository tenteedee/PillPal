import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  }

  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

  return supabaseClient;
}
