import type { ContactRequest, DiagnosticPayload, Lang, Report, ReportRequest } from '../shared/types';

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
  diagnostic: (lang: Lang) => request<DiagnosticPayload>(`/api/diagnostic?lang=${lang}`),
  report: (payload: ReportRequest) =>
    request<{ ok: true; report: Report }>('/api/diagnostic/report', { method: 'POST', body: JSON.stringify(payload) }).then((r) => r.report),
  contact: (payload: ContactRequest) => request<{ ok: true }>('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),
};
