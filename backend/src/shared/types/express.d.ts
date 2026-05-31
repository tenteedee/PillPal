import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    authUser?: User | null;
    accessToken?: string;
  }
}

export type AppRequest = Request;
