import { getDb } from "../db.js";
import {
  type CreateLogInput,
  type RequestLogRow,
  type UpdateLogInput,
  redactValue,
  serializeBody,
} from "./logs.js";
import { config } from "../config.js";

export function createRequestLog(input: CreateLogInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO api_request_logs (
      id, created_at, method, path, status_code, duration_ms, client_ip,
      model, stream, request_body
    ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
  ).run(
    input.id,
    new Date().toISOString(),
    input.method,
    input.path,
    input.clientIp ?? null,
    input.model ?? null,
    input.stream ? 1 : 0,
    serializeBody(redactValue(input.requestBody), config.logResponseMaxBytes),
  );
}

export function updateRequestLog(id: string, input: UpdateLogInput): void {
  const db = getDb();
  db.prepare(
    `UPDATE api_request_logs SET
      status_code = ?,
      duration_ms = ?,
      response_body = ?,
      error_message = ?,
      cursor_agent_id = ?,
      tokens_prompt = ?,
      tokens_completion = ?,
      file_id = ?,
      file_name = ?,
      file_size = ?,
      file_purpose = ?
    WHERE id = ?`,
  ).run(
    input.statusCode,
    input.durationMs,
    serializeBody(input.responseBody, config.logResponseMaxBytes),
    input.errorMessage ?? null,
    input.cursorAgentId ?? null,
    input.tokensPrompt ?? null,
    input.tokensCompletion ?? null,
    input.fileId ?? null,
    input.fileName ?? null,
    input.fileSize ?? null,
    input.filePurpose ?? null,
    id,
  );
}

export function listRequestLogs(options: {
  page: number;
  pageSize: number;
  path?: string;
  status?: number;
  model?: string;
}): { items: RequestLogRow[]; total: number } {
  const db = getDb();
  const offset = (options.page - 1) * options.pageSize;
  const where: string[] = [];
  const params: unknown[] = [];

  if (options.path) {
    where.push("path = ?");
    params.push(options.path);
  }
  if (options.status !== undefined) {
    where.push("status_code = ?");
    params.push(options.status);
  }
  if (options.model) {
    where.push("model = ?");
    params.push(options.model);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM api_request_logs ${whereSql}`).get(...params) as {
      c: number;
    }
  ).c;

  const items = db
    .prepare(
      `SELECT * FROM api_request_logs ${whereSql}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, options.pageSize, offset) as RequestLogRow[];

  return { items, total };
}

export function getRequestLog(id: string): RequestLogRow | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM api_request_logs WHERE id = ?`).get(id) as
    | RequestLogRow
    | undefined;
}

export function insertUploadedFile(input: {
  id: string;
  requestLogId: string;
  purpose: string;
  filename: string;
  bytes: number;
  storagePath: string;
}): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO uploaded_files (id, request_log_id, purpose, filename, bytes, storage_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.requestLogId,
    input.purpose,
    input.filename,
    input.bytes,
    input.storagePath,
    new Date().toISOString(),
  );
}
