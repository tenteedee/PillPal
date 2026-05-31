import type { Response } from "express";
import { HTTP_STATUS } from "../constants/http/http-status.js";
import { RESPONSE_MESSAGE } from "../constants/http/response-messages.js";

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = RESPONSE_MESSAGE.OK,
  status: number = HTTP_STATUS.OK,
): void {
  res.status(status).json({ data, message });
}

export function sendError(
  res: Response,
  error: ApiErrorPayload,
  status: number = HTTP_STATUS.BAD_REQUEST,
): void {
  res.status(status).json({ error });
}
