import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { parseGetListInput } from "../../shared/utils/list.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { MedicineLookupRepository } from "./medicine-lookup.repository.js";
import {
  medicineDataSourceListInputSchema,
  medicineLookupListInputSchema,
} from "./medicine-lookup.schema.js";
import { MedicineLookupService } from "./medicine-lookup.service.js";

const medicineLookupService = new MedicineLookupService(
  new MedicineLookupRepository(),
  new ProfileRepository(),
  new MedicationRepository(),
);

function requireLookupId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class MedicineLookupController {
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lookups = await medicineLookupService.listMyLookups(
        req.userId as string,
        parseGetListInput(req.query, medicineLookupListInputSchema),
      );
      sendSuccess(res, lookups);
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lookup = await medicineLookupService.getMyLookupById(
        req.userId as string,
        requireLookupId(req.params.id),
      );
      sendSuccess(res, lookup);
    } catch (error) {
      next(error);
    }
  };

  runById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lookup = await medicineLookupService.runMyLookup(
        req.userId as string,
        requireLookupId(req.params.id),
      );
      sendSuccess(res, lookup);
    } catch (error) {
      next(error);
    }
  };

  saveMedicationById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await medicineLookupService.saveMyLookupAsMedication(
        req.userId as string,
        requireLookupId(req.params.id),
        req.body,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  listSources = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const sources = await medicineLookupService.listMedicineDataSources(
        parseGetListInput(req.query, medicineDataSourceListInputSchema),
      );
      sendSuccess(res, sources);
    } catch (error) {
      next(error);
    }
  };
}

export const medicineLookupController = new MedicineLookupController();
