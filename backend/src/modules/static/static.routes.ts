import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { requireAuth } from "../../shared/middlewares/require-auth.middleware.js";
import { staticController } from "./static.controller.js";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const staticFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(
        new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODE.INVALID_UPLOAD_FILE,
          ERROR_MESSAGE.INVALID_UPLOAD_FILE,
        ),
      );
      return;
    }

    callback(null, true);
  },
});

function uploadSingleFile(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  staticFileUpload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof HttpError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      next(
        new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODE.INVALID_UPLOAD_FILE,
          ERROR_MESSAGE.INVALID_UPLOAD_FILE,
          error,
        ),
      );
      return;
    }

    next(error);
  });
}

const uploadRouter = Router();
uploadRouter.use(requireAuth);

/**
 * @openapi
 * /uploads:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload static file to Supabase Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               purpose:
 *                 type: string
 *                 enum: [medication_image, prescription_image, general]
 *                 default: general
 *     responses:
 *       201:
 *         description: Created. Returns staticId and file metadata.
 *       400:
 *         description: Invalid upload file
 *       401:
 *         description: Unauthorized
 */
uploadRouter.post("/", uploadSingleFile, staticController.uploadFile);

/**
 * @openapi
 * /uploads/{id}:
 *   get:
 *     tags:
 *       - Upload
 *     summary: Get uploaded static file metadata by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Static file not found
 */
uploadRouter.get("/:id", staticController.getFileById);

export { uploadRouter };
