import type { NextFunction, Request, Response } from "express";
import { verifySupabaseAccessToken } from "../../config/supabase-auth.js";
import { env } from "../../config/env.js";
import { ERROR_CODE } from "../constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../constants/error/error-messages.js";
import { HTTP_STATUS } from "../constants/http/http-status.js";
import { AUTH_COOKIE } from "../constants/auth-cookies.js";
import { HttpError } from "../errors/http-error.js";
import { parseCookieValue } from "../utils/cookies.js";
import { logger } from "../utils/logger.js";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  const cookieAccessToken = parseCookieValue(req, AUTH_COOKIE.ACCESS_TOKEN);
  const tokenToVerify = (bearerMatch?.[1] ?? cookieAccessToken ?? "").trim();

  if (tokenToVerify) {
    try {
      const user = await verifySupabaseAccessToken(tokenToVerify);
      if (!user) {
        next(
          new HttpError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODE.INVALID_AUTH_TOKEN,
            ERROR_MESSAGE.INVALID_AUTH_TOKEN,
          ),
        );
        return;
      }

      req.userId = user.id;
      req.authUser = user;
      req.accessToken = tokenToVerify;
      next();
      return;
    } catch (error) {
      logger.error("Auth verification upstream failure", error);
      next(
        new HttpError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODE.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGE.UNEXPECTED_SERVER_ERROR,
        ),
      );
      return;
    }
  }

  if (env.ENABLE_DEMO_AUTH && env.DEMO_PROFILE_ID) {
    req.userId = env.DEMO_PROFILE_ID;
    req.authUser = null;
    next();
    return;
  }

  next();
}
