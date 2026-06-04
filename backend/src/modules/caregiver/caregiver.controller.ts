import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { RESPONSE_MESSAGE } from "../../shared/constants/http/response-messages.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { CaregiverRepository } from "./caregiver.repository.js";
import { CaregiverService } from "./caregiver.service.js";

const caregiverService = new CaregiverService(
  new CaregiverRepository(),
  new ProfileRepository(),
);

function requireCaregiverLinkId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class CaregiverController {
  invite = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const link = await caregiverService.invite(req.userId as string, req.body);
      sendSuccess(res, link, RESPONSE_MESSAGE.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  accept = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const linkId = requireCaregiverLinkId(req.params.id);
      const link = await caregiverService.accept(req.userId as string, linkId);
      sendSuccess(res, link);
    } catch (error) {
      next(error);
    }
  };

  listCaregivers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const caregivers = await caregiverService.listCaregivers(
        req.userId as string,
      );
      sendSuccess(res, caregivers);
    } catch (error) {
      next(error);
    }
  };

  listPatients = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const patients = await caregiverService.listPatients(req.userId as string);
      sendSuccess(res, patients);
    } catch (error) {
      next(error);
    }
  };

  listInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const invitations = await caregiverService.listInvitations(
        req.userId as string,
      );
      sendSuccess(res, invitations);
    } catch (error) {
      next(error);
    }
  };

  revoke = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const linkId = requireCaregiverLinkId(req.params.id);
      const link = await caregiverService.revoke(req.userId as string, linkId);
      sendSuccess(res, link);
    } catch (error) {
      next(error);
    }
  };
}

export const caregiverController = new CaregiverController();
