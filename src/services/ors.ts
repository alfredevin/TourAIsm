import { devLog } from './logger';

export type ServiceErrorKind = 'noKey' | 'network' | 'quota' | 'noRoute' | 'failed';

export class ServiceError extends Error {
  constructor(
    readonly kind: ServiceErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export const SERVICE_ERROR_MESSAGES: Record<ServiceErrorKind, string> = {
  noKey: 'Missing or invalid API key. Check EXPO_PUBLIC_ORS_API_KEY in .env and restart the app.',
  network: 'No internet connection. Check your connection and try again.',
  quota: 'Daily API limit reached. Please try again later.',
  noRoute: 'No route found to that place.',
  failed: 'Something went wrong on the server. Please try again.',
};

// The key ships inside the app bundle. Move ORS calls behind a backend before production.
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY?.trim() ?? '';

type OrsRequest = {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
};

export async function orsFetch(path: string, init: OrsRequest = {}): Promise<Response> {
  const method = init.method ?? 'GET';
  const label = `${method} ${path.split('?')[0]}`;

  if (!ORS_API_KEY) {
    devLog(`${label}: EXPO_PUBLIC_ORS_API_KEY is empty`);
    throw new ServiceError('noKey', SERVICE_ERROR_MESSAGES.noKey);
  }

  const headers: Record<string, string> = {
    Authorization: ORS_API_KEY,
    Accept: 'application/json',
  };
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  devLog(`${label}: request`);
  try {
    const response = await fetch(`${ORS_BASE_URL}${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });
    devLog(`${label}: ${response.status}`);
    return response;
  } catch (error) {
    if (init.signal?.aborted) throw error;
    devLog(`${label}: network error`);
    throw new ServiceError('network', SERVICE_ERROR_MESSAGES.network);
  }
}

export function assertOk(response: Response): void {
  if (response.ok) return;
  if (response.status === 401 || response.status === 403) {
    throw new ServiceError('noKey', SERVICE_ERROR_MESSAGES.noKey);
  }
  if (response.status === 429) {
    throw new ServiceError('quota', SERVICE_ERROR_MESSAGES.quota);
  }
  throw new ServiceError('failed', `HTTP ${response.status}`);
}
