import type { NextFunction, Request, Response } from "express";

import { sendSuccess } from "../../shared/utils/response.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { AiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";

const aiService = new AiService(new AiRepository(), new ProfileRepository());

class AiController {
  scanMedication = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const scanResult = await aiService.scanMedication(
        req.userId as string,
        req.body,
      );
      sendSuccess(res, scanResult);
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
