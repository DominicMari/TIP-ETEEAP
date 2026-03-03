type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface TemplatePayload {
  name: string;
  subject: string;
  content: string;
}

interface EmailPayload {
  recipient: string;
  subject: string;
  body: string;
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(url: string, method: HttpMethod = 'GET', body?: any): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data as T;
}

// Templates
export async function fetchTemplates(options?: { search?: string; limit?: number; offset?: number; sort?: string; direction?: 'asc' | 'desc' }) {
  const qs = buildQuery(options || {});
  return request<{ data: any[] }>(`/api/templates${qs}`);
}

export async function createTemplate(payload: TemplatePayload) {
  return request<any>('/api/templates', 'POST', payload);
}

export async function updateTemplate(id: number, payload: Partial<TemplatePayload>) {
  const qs = buildQuery({ id });
  return request<any>(`/api/templates${qs}`, 'PATCH', payload);
}

export async function deleteTemplate(id: number) {
  const qs = buildQuery({ id });
  return request<{ message: string }>(`/api/templates${qs}`, 'DELETE');
}

// Email logs
export async function fetchEmailLogs(options?: {
  status?: string;
  recipient?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}) {
  const qs = buildQuery(options || {});
  return request<{ data: any[]; count: number; limit: number; offset: number }>(`/api/email-history${qs}`);
}

export async function fetchEmailLog(id: number) {
  return request<any>(`/api/email-history/${id}`);
}

// Send email
export async function sendEmail(payload: EmailPayload) {
  return request<{ message: string }>(`/api/send-email`, 'POST', payload);
}
