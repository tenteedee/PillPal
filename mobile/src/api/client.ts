import { Platform } from "react-native";
import { useAuthStore } from "../store/auth";

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const envAuthToken = process.env.EXPO_PUBLIC_AUTH_TOKEN;

const getBaseUrl = () => {
  if (envApiBaseUrl) {
    return envApiBaseUrl;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/api/v1";
  }

  return "http://localhost:4000/api/v1";
};

export const BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function createApiHeaders(
  options: {
    headers?: HeadersInit;
    hasJsonBody?: boolean;
    hasFormDataBody?: boolean;
  } = {},
): Headers {
  const headers = new Headers(options.headers || {});

  if (
    !headers.has("Content-Type") &&
    options.hasJsonBody &&
    !options.hasFormDataBody
  ) {
    headers.set("Content-Type", "application/json");
  }

  const { accessToken } = useAuthStore.getState();
  const token = accessToken ?? envAuthToken;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + token);
  }

  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(options.headers || {});

  // Set Content-Type default
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Get JWT token from auth store
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("Cookie", `pillpal_access_token=${accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let json: any;
  try {
    json = await response.json();
  } catch (err) {
    // If response is not JSON
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return {} as T;
  }

  if (!response.ok) {
    const errorMsg =
      json?.error?.message ||
      json?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  // If backend returns { data: ... } or { success: true, data: ... }
  // Our backend sends success responses as { data, message }
  return (json?.data !== undefined ? json.data : json) as T;
}
