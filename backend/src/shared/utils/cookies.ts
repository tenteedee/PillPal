import type { CookieOptions, Request, Response } from 'express';

import { env } from '../../config/env.js';
import { AUTH_COOKIE } from '../constants/auth-cookies.js';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function parseCookieValue(req: Request, cookieName: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookieParts = cookieHeader.split(';');
  for (const part of cookieParts) {
    const [rawName, ...rawValueParts] = part.trim().split('=');
    if (rawName === cookieName) {
      const rawValue = rawValueParts.join('=');
      return decodeURIComponent(rawValue);
    }
  }

  return null;
}

function getBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  payload: { accessToken: string },
): void {
  const baseOptions = getBaseCookieOptions();

  res.cookie(AUTH_COOKIE.ACCESS_TOKEN, payload.accessToken, {
    ...baseOptions,
    maxAge: THREE_DAYS_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  const baseOptions = getBaseCookieOptions();

  res.clearCookie(AUTH_COOKIE.ACCESS_TOKEN, baseOptions);
}
