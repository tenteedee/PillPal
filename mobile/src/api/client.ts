import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth';

// Helper to determine base URL depending on platform
const getBaseUrl = () => {
  // Check if we have an environment override, or use default emulator/localhost ports
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }
  return 'http://localhost:4000/api/v1';
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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(options.headers || {});

  // Set Content-Type default
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Get JWT token from auth store
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
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
    const errorMsg = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  // If backend returns { data: ... } or { success: true, data: ... }
  // Our backend sends success responses as { data, message }
  return (json?.data !== undefined ? json.data : json) as T;
}
