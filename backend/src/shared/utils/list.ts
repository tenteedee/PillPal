import type { ZodType } from 'zod';

import { ERROR_CODE } from '../constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../constants/error/error-messages.js';
import { HTTP_STATUS } from '../constants/http/http-status.js';
import { HttpError } from '../errors/http-error.js';
import type { GetListInput } from '../types/list.js';

export function parseGetListInput<TFilters extends Record<string, unknown>>(
  query: Record<string, unknown>,
  schema: ZodType<GetListInput<TFilters>>,
): GetListInput<TFilters> {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}
