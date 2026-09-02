import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { openAiAuthOk } from "../auth.js";
import {
  listCursorModels,
  messagesToPrompt,
  openAiChatResponse,
  runCursorPrompt,
  sseChatChunk,
} from "../providers/cursor.js";
import { createRequestLog, updateRequestLog } from "../store/repository.js";

type ChatBody = {
  model?: string;
  messages?: Array<{ role: string; content?: unknown }>;
  stream?: boolean;
};

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/chat/completions", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!openAiAuthOk(request.headers.authorization)) {
      return reply.code(401).send({ error: { message: "Invalid API key", type: "invalid_request_error" } });
    }

    const body = request.body as ChatBody;
    const logId = randomUUID();
    const started = Date.now();
    const model = body.model ?? config.defaultModel;
    const stream = Boolean(body.stream);
    const messages = body.messages ?? [];

    createRequestLog({
      id: logId,
      method: "POST",
      path: "/v1/chat/completions",
      clientIp: request.ip,
      model,
      stream,
      requestBody: body,
    });

    reply.header("X-Request-Id", logId);

    try {
      const prompt = messagesToPrompt(messages as Parameters<typeof messagesToPrompt>[0]);
      const completionId = `chatcmpl_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

      if (stream) {
        reply.raw.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        let fullText = "";
        const result = await runCursorPrompt({
          prompt,
          model,
          stream: true,
          onDelta: (delta) => {
            fullText += delta;
            reply.raw.write(`data: ${JSON.stringify(sseChatChunk({ id: completionId, model, delta }))}\n\n`);
          },
        });

        reply.raw.write(`data: ${JSON.stringify(sseChatChunk({ id: completionId, model, delta: "", finish: true }))}\n\n`);
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();

        updateRequestLog(logId, {
          statusCode: 200,
          durationMs: Date.now() - started,
          responseBody: { content: fullText, stream: true },
          cursorAgentId: result.agentId,
        });
        return reply;
      }

      const result = await runCursorPrompt({ prompt, model });
      const payload = openAiChatResponse({
        id: completionId,
        model,
        content: result.text,
      });

      updateRequestLog(logId, {
        statusCode: 200,
        durationMs: Date.now() - started,
        responseBody: payload,
        cursorAgentId: result.agentId,
      });

      return reply.send(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      updateRequestLog(logId, {
        statusCode: 500,
        durationMs: Date.now() - started,
        errorMessage: message,
      });
      return reply.code(500).send({ error: { message, type: "server_error" } });
    }
  });

  app.get("/v1/models", async (request, reply) => {
    if (!openAiAuthOk(request.headers.authorization)) {
      return reply.code(401).send({ error: { message: "Invalid API key", type: "invalid_request_error" } });
    }

    const logId = randomUUID();
    const started = Date.now();
    createRequestLog({
      id: logId,
      method: "GET",
      path: "/v1/models",
      clientIp: request.ip,
    });
    reply.header("X-Request-Id", logId);

    try {
      const models = await listCursorModels();
      const payload = {
        object: "list",
        data: models.map((m) => ({
          id: m.id,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: m.owned_by,
        })),
      };
      updateRequestLog(logId, {
        statusCode: 200,
        durationMs: Date.now() - started,
        responseBody: payload,
      });
      return reply.send(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      updateRequestLog(logId, {
        statusCode: 500,
        durationMs: Date.now() - started,
        errorMessage: message,
      });
      return reply.code(500).send({ error: { message, type: "server_error" } });
    }
  });
}
