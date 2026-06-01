import type { NextFunction, Request, Response } from 'express';

import { ERROR_CODE } from '../../shared/constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../../shared/constants/error/error-messages.js';
import { RESPONSE_MESSAGE } from '../../shared/constants/http/response-messages.js';
import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { MedicationCatalogRepository } from './medication-catalog.repository.js';
import { MedicationCatalogService } from './medication-catalog.service.js';

const medicationCatalogService = new MedicationCatalogService(
  new MedicationCatalogRepository(),
);

function requireCatalogId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

function requireSearchQuery(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class MedicationCatalogController {
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const catalogs = await medicationCatalogService.list();
      sendSuccess(res, catalogs);
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = requireSearchQuery(req.query.q);
      const catalogs = await medicationCatalogService.search(q);
      sendSuccess(res, catalogs);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const catalog = await medicationCatalogService.create(req.body);
      sendSuccess(res, catalog, RESPONSE_MESSAGE.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireCatalogId(req.params.id);
      const catalog = await medicationCatalogService.getById(id);
      sendSuccess(res, catalog);
    } catch (error) {
      next(error);
    }
  };

  updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireCatalogId(req.params.id);
      const catalog = await medicationCatalogService.updateById(id, req.body);
      sendSuccess(res, catalog);
    } catch (error) {
      next(error);
    }
  };

  deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireCatalogId(req.params.id);
      await medicationCatalogService.deleteById(id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const medicationCatalogController = new MedicationCatalogController();
