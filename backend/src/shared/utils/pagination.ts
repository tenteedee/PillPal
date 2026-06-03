import { ERROR_CODE } from '../constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../constants/error/error-messages.js';
import { HTTP_STATUS } from '../constants/http/http-status.js';
import { HttpError } from '../errors/http-error.js';
import {
  DEFAULT_PAGINATION_LIMIT,
  paginationInputSchema,
  type PaginationInput,
} from '../types/pagination.js';

export function parsePaginationInput(query: Record<string, unknown>): PaginationInput {
  const parsed = paginationInputSchema.safeParse({
    page: query.page,
    limit: query.limit,
  });

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

export function getPaginationRange(
  input: PaginationInput = { page: 1, limit: DEFAULT_PAGINATION_LIMIT },
): {
  from: number;
  to: number;
} {
  const from = (input.page - 1) * input.limit;

  return {
    from,
    to: from + input.limit - 1,
  };
}
