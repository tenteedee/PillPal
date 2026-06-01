import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { RESPONSE_MESSAGE } from '../../shared/constants/http/response-messages.js';
import { clearAuthCookies, setAuthCookies } from '../../shared/utils/cookies.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

const authService = new AuthService(new AuthRepository());

class AuthController {
  me = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const me = authService.getMe(req.authUser);
      sendSuccess(res, me);
    } catch (error) {
      next(error);
    }
  };

  signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await authService.signUp(req.body);
      setAuthCookies(res, {
        accessToken: session.accessToken,
      });
      sendSuccess(res, session, RESPONSE_MESSAGE.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await authService.login(req.body);
      setAuthCookies(res, {
        accessToken: session.accessToken,
      });
      sendSuccess(res, session);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.logout(req.accessToken);
      clearAuthCookies(res);
      sendSuccess(res, { loggedOut: true });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
