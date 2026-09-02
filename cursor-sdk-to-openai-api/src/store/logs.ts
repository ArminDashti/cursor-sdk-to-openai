export type RequestLogRow = {
  id: string;
  created_at: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  client_ip: string | null;
  model: string | null;
  stream: number;
  request_body: string | null;
  response_body: string | null;
  error_message: string | null;
  cursor_agent_id: string | null;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  file_id: string | null;
  file_name: string | null;
  file_size: number | null;
  file_purpose: string | null;
};

export type CreateLogInput = {
  id: string;
  method: string;
  path: string;
  clientIp?: string;
  model?: string;
  stream?: boolean;
  requestBody?: unknown;
};

export type UpdateLogInput = {
  statusCode: number;
  durationMs: number;
  responseBody?: unknown;
  errorMessage?: string;
  cursorAgentId?: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  filePurpose?: string;
};

const SENSITIVE_KEYS = new Set([
  "authorization",
  "api_key",
  "apikey",
  "password",
  "token",
  "secret",
]);

export function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = redactValue(val);
    }
  }
  return out;
}

export function serializeBody(value: unknown, maxBytes: number): string | null {
  if (value === undefined) return null;
  try {
    let text = typeof value === "string" ? value : JSON.stringify(value);
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      text = text.slice(0, maxBytes) + "…[truncated]";
    }
    return text;
  } catch {
    return null;
  }
}
