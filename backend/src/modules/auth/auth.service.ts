import type { User } from '@supabase/supabase-js';

import { HttpError } from '../../shared/errors/http-error.js';
import { ERROR_CODE } from '../../shared/constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../../shared/constants/error/error-messages.js';
import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { mapAuthUserToMeResponse, mapSessionToAuthSessionResponse } from './auth.mapper.js';
import { AuthRepository } from './auth.repository.js';
import type { LoginBody, SignUpBody } from './auth.schema.js';
import type { AuthMeResponse, AuthSessionResponse } from './auth.types.js';

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  getMe(authUser?: User | null): AuthMeResponse {
    if (!authUser) {
      throw new HttpError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODE.UNAUTHORIZED,
        ERROR_MESSAGE.MISSING_USER_IDENTITY,
      );
    }

    return mapAuthUserToMeResponse(authUser);
  }

  async signUp(payload: SignUpBody): Promise<AuthSessionResponse> {
    const { session } = await this.repository.signUp(payload);
    return mapSessionToAuthSessionResponse(session);
  }

  async login(payload: LoginBody): Promise<AuthSessionResponse> {
    const { session } = await this.repository.login(payload);
    return mapSessionToAuthSessionResponse(session);
  }

  async logout(accessToken?: string): Promise<void> {
    if (!accessToken) {
      throw new HttpError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODE.UNAUTHORIZED,
        ERROR_MESSAGE.MISSING_USER_IDENTITY,
      );
    }

    await this.repository.logout(accessToken);
  }
}
