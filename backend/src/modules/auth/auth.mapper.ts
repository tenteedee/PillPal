import type { User } from '@supabase/supabase-js';

import type { AuthMeResponse, AuthSessionResponse } from './auth.types.js';

export function mapAuthUserToMeResponse(user: User): AuthMeResponse {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role ?? null,
    isAnonymous: user.is_anonymous ?? false,
  };
}

type SessionLike = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
};

export function mapSessionToAuthSessionResponse(
  session: SessionLike,
): AuthSessionResponse {
  return {
    accessToken: session.access_token,
    expiresIn: session.expires_in,
    expiresAt: session.expires_at ?? null,
    tokenType: session.token_type,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
  };
}
