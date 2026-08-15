import type {
  ContainerAction,
  ContainerDetail,
  ContainerSummary,
  ImageSummary,
  SessionInfo,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // response had no JSON body — fall back to statusText
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  me: () => request<SessionInfo>('/api/auth/me'),
};

export const containersApi = {
  list: (all = true) => request<ContainerSummary[]>(`/api/containers?all=${all}`),
  get: (id: string) => request<ContainerDetail>(`/api/containers/${id}`),
  action: (id: string, action: ContainerAction) =>
    request<void>(`/api/containers/${id}/${action}`, { method: 'POST' }),
  logTail: (id: string, tail = 200) =>
    request<{ lines: string[] }>(`/api/containers/${id}/logs?tail=${tail}`),
  logDownloadUrl: (id: string) => `/api/containers/${id}/logs/download`,
};

export const imagesApi = {
  list: () => request<ImageSummary[]>('/api/images'),
};
