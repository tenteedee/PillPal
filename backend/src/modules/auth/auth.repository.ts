import { AuthApiError, createClient } from '@supabase/supabase-js';

import { env } from '../../config/env.js';
import { ERROR_CODE } from '../../shared/constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../../shared/constants/error/error-messages.js';
import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { HttpError } from '../../shared/errors/http-error.js';

import type { LoginBody, SignUpBody } from './auth.schema.js';

function getAuthClient() {
  const authKey = env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !authKey) {
    throw new HttpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODE.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGE.UNEXPECTED_SERVER_ERROR,
    );
  }

  return createClient(env.SUPABASE_URL, authKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class AuthRepository {
  async signUp(payload: SignUpBody) {
    const client = getAuthClient();
    const { data, error } = await client.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      if (error instanceof AuthApiError) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODE.AUTH_SIGNUP_FAILED,
          error.message || ERROR_MESSAGE.AUTH_SIGNUP_FAILED,
        );
      }

      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.AUTH_SIGNUP_FAILED,
        ERROR_MESSAGE.AUTH_SIGNUP_FAILED,
        error,
      );
    }

    if (!data.session || !data.user) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.AUTH_SIGNUP_FAILED,
        'Signup succeeded but session is unavailable. Check email confirmation settings.',
      );
    }

    return { session: data.session, user: data.user };
  }

  async login(payload: LoginBody) {
    const client = getAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      if (error instanceof AuthApiError) {
        throw new HttpError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODE.AUTH_LOGIN_FAILED,
          error.message || ERROR_MESSAGE.AUTH_LOGIN_FAILED,
        );
      }

      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.AUTH_LOGIN_FAILED,
        ERROR_MESSAGE.AUTH_LOGIN_FAILED,
        error,
      );
    }

    if (!data.session || !data.user) {
      throw new HttpError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODE.AUTH_LOGIN_FAILED,
        ERROR_MESSAGE.AUTH_LOGIN_FAILED,
      );
    }

    return { session: data.session, user: data.user };
  }

  async logout(accessToken: string): Promise<void> {
    const authKey = env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
    if (!env.SUPABASE_URL || !authKey) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGE.UNEXPECTED_SERVER_ERROR,
      );
    }

    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: authKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.AUTH_LOGOUT_FAILED,
        ERROR_MESSAGE.AUTH_LOGOUT_FAILED,
      );
    }
  }
}
