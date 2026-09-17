# cursor-sdk-to-openai

Local **OpenAI-compatible API** powered by [`@cursor/sdk`](https://cursor.com/docs/api/sdk/typescript). Point any OpenAI client at `http://127.0.0.1:8140/v1` and use Cursor models on localhost.

| Folder | Stack | Dev URL |
|--------|-------|---------|
| [cursor-sdk-to-openai-api](./cursor-sdk-to-openai-api/) | Node.js, Fastify, SQLite | http://127.0.0.1:8140 |
| [cursor-sdk-to-openai-webui](./cursor-sdk-to-openai-webui/) | Vue 3, Tailwind, shadcn-vue | http://127.0.0.1:5190 |

## Implemented OpenAI endpoints

See [ENDPOINTS.md](./ENDPOINTS.md) for curl examples.

| Method | Path |
|--------|------|
| POST | `/v1/chat/completions` |
| GET | `/v1/models` |
| POST | `/v1/responses` |
| POST | `/v1/files` |
| GET | `/health` |

## Quick start

```bash
# API
cd cursor-sdk-to-openai-api
copy .env.example .env
# set CURSOR_API_KEY_RAMIN_DASHTI_WORK in .env
npm install
npm run dev

# WebUI (separate terminal)
cd cursor-sdk-to-openai-webui
npm install
npm run dev
```

WebUI login: `armin` / `dopadopa123` (views logs and endpoint reference only — no chat UI).

## OpenAI client example

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AUTH_KEY ?? "local",
  baseURL: "http://127.0.0.1:8140/v1",
});

const res = await client.chat.completions.create({
  model: "composer-2.5",
  messages: [{ role: "user", content: "Hello" }],
});
```

## Logging

- All requests are stored in SQLite (`DATABASE_PATH`, default `./data/cursor-sdk-to-openai.db`).
- **Retention: 30 days** — older logs and uploaded files are purged on startup and every 24 hours.
- Override with `LOG_RETENTION_DAYS=30` in the API `.env`.
