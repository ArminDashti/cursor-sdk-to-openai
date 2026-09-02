# OpenAI-compatible endpoints

Base URL: `http://127.0.0.1:8140/v1`

Optional auth: `Authorization: Bearer <AUTH_KEY>` when `AUTH_KEY` is set in API `.env`.

## 1. POST /v1/chat/completions

```bash
curl http://127.0.0.1:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "composer-2.5",
    "messages": [{"role": "user", "content": "Say hello in one sentence."}]
  }'
```

Streaming:

```bash
curl http://127.0.0.1:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "composer-2.5",
    "stream": true,
    "messages": [{"role": "user", "content": "Count to three."}]
  }'
```

## 2. GET /v1/models

```bash
curl http://127.0.0.1:8140/v1/models
```

## 3. POST /v1/responses

```bash
curl http://127.0.0.1:8140/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "model": "composer-2.5",
    "input": "Summarize OpenAI-compatible proxies in one sentence."
  }'
```

## 14. POST /v1/files

```bash
curl http://127.0.0.1:8140/v1/files \
  -F purpose=assistants \
  -F file=@./README.md
```

## Health

```bash
curl http://127.0.0.1:8140/health
```
