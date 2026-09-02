CREATE TABLE IF NOT EXISTS api_request_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  client_ip TEXT,
  model TEXT,
  stream INTEGER NOT NULL DEFAULT 0,
  request_body TEXT,
  response_body TEXT,
  error_message TEXT,
  cursor_agent_id TEXT,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  file_id TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_purpose TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_path ON api_request_logs(path);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  request_log_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  filename TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_log_id) REFERENCES api_request_logs(id)
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);
