import {
  AuthApiError,
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { env } from "./env.js";

let supabaseAuthClient: SupabaseClient | null = null;

function getSupabaseAuthClient(): SupabaseClient {
  if (supabaseAuthClient) {
    return supabaseAuthClient;
  }

  const authKey = env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !authKey) {
    throw new Error(
      "Supabase auth is not configured. Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY",
    );
  }

  supabaseAuthClient = createClient(env.SUPABASE_URL, authKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return supabaseAuthClient;
}

export async function verifySupabaseAccessToken(
  accessToken: string,
): Promise<User | null> {
  const client = getSupabaseAuthClient();
  const { data, error } = await client.auth.getUser(accessToken);

  if (error) {
    if (error instanceof AuthApiError) {
      return null;
    }
    throw error;
  }

  return data.user ?? null;
}
