import { BASE_URL, createApiHeaders } from './client';

export type UploadStaticFileResponse = {
  staticId: string;
  url: string;
  bucket: string;
  path: string;
  contentType: string;
  size: number;
  purpose: 'medication_image' | 'prescription_image' | 'general';
  createdAt: string;
  updatedAt: string | null;
};

export type MedicationScanExtraction = {
  name: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  visibleText: string[];
  confidence: number;
};

export type MedicationScanCandidate = {
  catalogId: string | null;
  userMedicationId: string | null;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  confidence: number;
  matchStatus: 'user_medication_matched' | 'catalog_matched' | 'no_match';
  reason: string;
};

export type MedicationScanResult = {
  scanAttemptId: string;
  staticId: string;
  imageUrl: string;
  extractedData: MedicationScanExtraction;
  candidates: MedicationScanCandidate[];
  needsUserConfirmation: true;
  source: 'openai' | 'mock';
};

export type ScanImageAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

type ApiEnvelope<T> = {
  data: T;
  message: string;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | ApiErrorEnvelope
    | null;

  if (!response.ok) {
    const message =
      payload && 'error' in payload && payload.error?.message
        ? payload.error.message
        : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
    throw new Error(message);
  }

  if (!payload || !('data' in payload)) {
    throw new Error('Phản hồi từ máy chủ không hợp lệ.');
  }

  return payload.data;
}

function getAssetName(asset: ScanImageAsset): string {
  if (asset.fileName) {
    return asset.fileName;
  }

  const uriName = asset.uri.split('/').pop()?.split('?')[0];
  return uriName && uriName.includes('.') ? uriName : 'pillpal-scan-' + Date.now() + '.jpg';
}

function getAssetType(asset: ScanImageAsset): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  if (asset.uri.startsWith('data:image/png')) {
    return 'image/png';
  }

  if (asset.uri.startsWith('data:image/webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

async function appendUploadFile(formData: FormData, asset: ScanImageAsset): Promise<void> {
  const name = getAssetName(asset);
  const type = getAssetType(asset);

  if (asset.uri.startsWith('data:')) {
    const blob = await fetch(asset.uri).then((response) => response.blob());
    formData.append('file', blob, name);
    return;
  }

  formData.append('file', {
    uri: asset.uri,
    name,
    type,
  } as unknown as Blob);
}

export async function uploadMedicationImage(
  asset: ScanImageAsset,
): Promise<UploadStaticFileResponse> {
  const formData = new FormData();
  await appendUploadFile(formData, asset);
  formData.append('purpose', 'medication_image');

  const response = await fetch(BASE_URL + '/uploads', {
    method: 'POST',
    headers: createApiHeaders({ hasFormDataBody: true }),
    body: formData,
    credentials: 'include',
  });

  return readApiResponse<UploadStaticFileResponse>(response);
}

export async function scanMedicationByStaticId(
  staticId: string,
): Promise<MedicationScanResult> {
  const response = await fetch(BASE_URL + '/ai/scan-medication', {
    method: 'POST',
    headers: createApiHeaders({ hasJsonBody: true }),
    body: JSON.stringify({ staticId }),
    credentials: 'include',
  });

  return readApiResponse<MedicationScanResult>(response);
}
