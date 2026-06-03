import type { PaginationInput } from './pagination.js';

export type GetListInput<TFilters extends Record<string, unknown>> =
  PaginationInput & TFilters;
