export type StaticFilePurpose = "medication_image" | "prescription_image" | "general";

export type StaticFileRow = {
  id: string;
  user_id: string;
  url: string;
  storage_bucket: string;
  storage_path: string;
  file_size: number;
  file_type: string;
  purpose: StaticFilePurpose;
  created_at: string;
  updated_at: string | null;
};

export type StaticFileDto = {
  staticId: string;
  url: string;
  bucket: string;
  path: string;
  contentType: string;
  size: number;
  purpose: StaticFilePurpose;
  createdAt: string;
  updatedAt: string | null;
};
