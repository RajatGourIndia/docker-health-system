import type {
  AdminSettings,
  ContainerAction,
  ContainerDetail,
  ContainerSummary,
  ImageSummary,
  SessionInfo,
  SetupStatus,
  SystemInfo,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Set by AuthContext so that ANY 401 from ANY API call — not just the ones a
// caller happens to check for — immediately drops the app back to the login
// screen instead of leaving stale authenticated-looking UI on screen.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
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
    if (res.status === 401 && path !== '/api/auth/login') {
      onUnauthorized?.();
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

export const setupApi = {
  status: () => request<SetupStatus>('/api/setup/status'),
  create: (username: string, password: string) =>
    request<void>('/api/setup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const adminApi = {
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    request<void>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }),
  getSettings: () => request<AdminSettings>('/api/admin/settings'),
  updateSettings: (patch: Partial<AdminSettings>) =>
    request<AdminSettings>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
  systemInfo: () => request<SystemInfo>('/api/admin/system-info'),
};
