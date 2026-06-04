import type { StaticFileDto, StaticFileRow } from "./static.types.js";

export function mapStaticFileRowToDto(row: StaticFileRow): StaticFileDto {
  return {
    staticId: row.id,
    url: row.url,
    bucket: row.storage_bucket,
    path: row.storage_path,
    contentType: row.file_type,
    size: row.file_size,
    purpose: row.purpose,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
