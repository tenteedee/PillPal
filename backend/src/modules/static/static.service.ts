import { randomUUID } from "node:crypto";
import path from "node:path";

import { env } from "../../config/env.js";
import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { mapStaticFileRowToDto } from "./static.mapper.js";
import { StaticRepository } from "./static.repository.js";
import type { StaticFileDto, StaticFilePurpose } from "./static.types.js";

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export class StaticService {
  constructor(private readonly staticRepository: StaticRepository) {}

  async uploadFile(
    userId: string,
    file: Express.Multer.File | undefined,
    purpose: StaticFilePurpose = "general",
  ): Promise<StaticFileDto> {
    if (!file) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.INVALID_UPLOAD_FILE,
        ERROR_MESSAGE.INVALID_UPLOAD_FILE,
      );
    }

    const extension = IMAGE_EXTENSION_BY_MIME_TYPE[file.mimetype];
    if (!extension) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.INVALID_UPLOAD_FILE,
        ERROR_MESSAGE.INVALID_UPLOAD_FILE,
      );
    }

    const bucket = env.SUPABASE_STORAGE_BUCKET;
    const objectPath = buildFilePath(userId, purpose, extension);
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.UPLOAD_FAILED,
        `Failed to upload medication image for user ${userId}`,
        error,
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

    const row = await this.staticRepository.create({
      userId,
      url: data.publicUrl,
      bucket,
      path: objectPath,
      contentType: file.mimetype,
      size: file.size,
      purpose,
    });

    return mapStaticFileRowToDto(row);
  }

  async getFileById(userId: string, staticId: string): Promise<StaticFileDto> {
    const row = await this.staticRepository.findByIdAndUserId(staticId, userId);

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.STATIC_FILE_NOT_FOUND,
        ERROR_MESSAGE.STATIC_FILE_NOT_FOUND,
      );
    }

    return mapStaticFileRowToDto(row);
  }
}

function buildFilePath(
  userId: string,
  purpose: StaticFilePurpose,
  extension: string,
): string {
  const safeUserId = path.posix.basename(userId);
  return `${purpose}/${safeUserId}/${Date.now()}-${randomUUID()}.${extension}`;
}
