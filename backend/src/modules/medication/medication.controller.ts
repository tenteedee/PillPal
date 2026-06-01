import type { NextFunction, Request, Response } from 'express';

import { ERROR_CODE } from '../../shared/constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../../shared/constants/error/error-messages.js';
import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { RESPONSE_MESSAGE } from '../../shared/constants/http/response-messages.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ProfileRepository } from '../profile/profile.repository.js';
import { MedicationRepository } from './medication.repository.js';
import { MedicationService } from './medication.service.js';

const medicationService = new MedicationService(
  new MedicationRepository(),
  new ProfileRepository(),
);

function toBooleanFlag(value: unknown): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  return undefined;
}

function requireMedicationId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class MedicationController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const active = toBooleanFlag(req.query.active);
      const medications = await medicationService.list(req.userId as string, active);
      sendSuccess(res, medications);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medication = await medicationService.create(req.userId as string, req.body);
      sendSuccess(res, medication, RESPONSE_MESSAGE.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medicationId = requireMedicationId(req.params.id);
      const medication = await medicationService.getById(
        req.userId as string,
        medicationId,
      );
      sendSuccess(res, medication);
    } catch (error) {
      next(error);
    }
  };

  updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medicationId = requireMedicationId(req.params.id);
      const medication = await medicationService.updateById(
        req.userId as string,
        medicationId,
        req.body,
      );
      sendSuccess(res, medication);
    } catch (error) {
      next(error);
    }
  };

  stopById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medicationId = requireMedicationId(req.params.id);
      const medication = await medicationService.stopById(
        req.userId as string,
        medicationId,
      );
      sendSuccess(res, medication);
    } catch (error) {
      next(error);
    }
  };

  deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medicationId = requireMedicationId(req.params.id);
      await medicationService.deleteById(req.userId as string, medicationId);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const medicationController = new MedicationController();
