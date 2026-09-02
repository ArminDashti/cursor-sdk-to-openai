# cursor-sdk-to-openai-api

Node.js OpenAI-compatible proxy using `@cursor/sdk`. Logs every request to SQLite (30-day retention).

## Run

```bash
copy .env.example .env
# set CURSOR_API_KEY
npm install
npm run dev
```

Listens on `http://127.0.0.1:8140`.

## Env

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `./data/cursor-sdk-to-openai.db` | SQLite file |
| `LOG_RETENTION_DAYS` | `30` | Delete logs and uploads older than this |
| `CURSOR_API_KEY` | — | Required for chat/responses |
| `AUTH_KEY` | — | Optional bearer for OpenAI routes |

## Admin API

- `POST /admin/auth/login` — WebUI login
- `GET /admin/logs` — paginated request logs
- `GET /admin/logs/:id` — log detail
- `GET /admin/endpoints` — endpoint catalog
