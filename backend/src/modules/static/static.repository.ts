import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { StaticFilePurpose, StaticFileRow } from "./static.types.js";

export class StaticRepository {
  async create(input: {
    userId: string;
    url: string;
    bucket: string;
    path: string;
    size: number;
    contentType: string;
    purpose: StaticFilePurpose;
  }): Promise<StaticFileRow> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("statics")
      .insert({
        user_id: input.userId,
        url: input.url,
        storage_bucket: input.bucket,
        storage_path: input.path,
        file_size: input.size,
        file_type: input.contentType,
        purpose: input.purpose,
      })
      .select("*")
      .single<StaticFileRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.STATIC_FILE_CREATE_FAILED,
        `Failed to create static file record for user ${input.userId}`,
        error,
      );
    }

    return data;
  }

  async findByIdAndUserId(
    staticId: string,
    userId: string,
  ): Promise<StaticFileRow | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("statics")
      .select("*")
      .eq("id", staticId)
      .eq("user_id", userId)
      .maybeSingle<StaticFileRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.STATIC_FILE_READ_FAILED,
        `Failed to read static file ${staticId}`,
        error,
      );
    }

    return data;
  }
}
