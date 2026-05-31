import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env.js';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    req.userId = authHeader.slice('Bearer '.length).trim();
  } else if (env.DEMO_PROFILE_ID) {
    req.userId = env.DEMO_PROFILE_ID;
  }

  next();
}
