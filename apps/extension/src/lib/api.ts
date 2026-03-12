import { storageGet, storageRemove } from './storage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type StoredSession = { access_token?: string } | undefined;

async function getToken(): Promise<string | null> {
  const result = await storageGet('authToken');
  return (result.authToken as StoredSession)?.access_token ?? null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    await storageRemove(['authToken', 'user']);
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function snapBookmark(bookmark: {
  url: string;
  title: string;
  description?: string;
  favicon_url?: string;
}) {
  return request<any>('/bookmarks', {
    method: 'POST',
    body: JSON.stringify(bookmark),
  });
}

export function getBookmarks(page = 1, limit = 20) {
  return request<{ bookmarks: any[]; total: number }>(
    `/bookmarks?page=${page}&limit=${limit}`,
  );
}

export function searchBookmarks(query: string, limit = 10) {
  return request<any[]>(
    `/bookmarks/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
}

export function getFolders() {
  return request<any[]>('/folders');
}

export function deleteBookmark(id: string) {
  return request<{ deleted: boolean }>(`/bookmarks/${id}`, {
    method: 'DELETE',
  });
}
