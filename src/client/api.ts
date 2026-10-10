import type { ContactRequest } from '../shared/types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? res.statusText), { field: body.field as string | undefined });
  return body as T;
}

export const api = {
  contact: (payload: ContactRequest) => request<{ ok: true }>('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),
};
