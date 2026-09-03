const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:9090";
const TOKEN_KEY = "cursor_sdk_openai_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return res.json() as Promise<T>;
}

export type LogRow = {
  id: string;
  created_at: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  model: string | null;
  stream: number;
  error_message: string | null;
};

export type LogDetail = LogRow & {
  client_ip: string | null;
  request_body: string | null;
  response_body: string | null;
  cursor_agent_id: string | null;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  file_id: string | null;
  file_name: string | null;
  file_size: number | null;
  file_purpose: string | null;
};

export type LogsResponse = {
  page: number;
  page_size: number;
  total: number;
  retention_days: number;
  items: LogRow[];
};

export type EndpointItem = {
  method: string;
  path: string;
  description: string;
  example: string;
};

export async function login(username: string, password: string): Promise<void> {
  const data = await apiFetch<{ token: string }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
}

export async function fetchLogs(page = 1, pageSize = 20): Promise<LogsResponse> {
  return apiFetch(`/admin/logs?page=${page}&page_size=${pageSize}`);
}

export async function fetchLog(id: string): Promise<LogDetail> {
  return apiFetch(`/admin/logs/${id}`);
}

export async function fetchEndpoints(): Promise<{ endpoints: EndpointItem[] }> {
  return apiFetch("/admin/endpoints");
}
