export const ENDPOINT_CATALOG = [
  {
    method: "POST",
    path: "/v1/chat/completions",
    description: "Chat completions via Cursor SDK (JSON or SSE stream).",
    example: `curl http://127.0.0.1:8140/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"composer-2.5","messages":[{"role":"user","content":"Hello"}]}'`,
  },
  {
    method: "GET",
    path: "/v1/models",
    description: "List models available through this proxy.",
    example: "curl http://127.0.0.1:8140/v1/models",
  },
  {
    method: "POST",
    path: "/v1/responses",
    description: "OpenAI Responses API shape backed by Cursor SDK.",
    example: `curl http://127.0.0.1:8140/v1/responses \\
  -H "Content-Type: application/json" \\
  -d '{"model":"composer-2.5","input":"Hello"}'`,
  },
  {
    method: "POST",
    path: "/v1/files",
    description: "Upload a file (stored locally with metadata in SQLite).",
    example: `curl http://127.0.0.1:8140/v1/files \\
  -F purpose=assistants \\
  -F file=@./README.md`,
  },
  {
    method: "GET",
    path: "/health",
    description: "Liveness and SQLite connectivity.",
    example: "curl http://127.0.0.1:8140/health",
  },
];
