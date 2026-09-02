import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { createWriteStream, statSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { config } from "../config.js";
import { openAiAuthOk } from "../auth.js";
import {
  openAiResponsesResponse,
  responsesInputToPrompt,
  runCursorPrompt,
} from "../providers/cursor.js";
import { createRequestLog, insertUploadedFile, updateRequestLog } from "../store/repository.js";

type ResponsesBody = {
  model?: string;
  input?: unknown;
  stream?: boolean;
};

export async function registerResponsesRoute(app: FastifyInstance): Promise<void> {
  app.post("/v1/responses", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!openAiAuthOk(request.headers.authorization)) {
      return reply.code(401).send({ error: { message: "Invalid API key", type: "invalid_request_error" } });
    }

    const body = request.body as ResponsesBody;
    const logId = randomUUID();
    const started = Date.now();
    const model = body.model ?? config.defaultModel;

    createRequestLog({
      id: logId,
      method: "POST",
      path: "/v1/responses",
      clientIp: request.ip,
      model,
      stream: Boolean(body.stream),
      requestBody: body,
    });
    reply.header("X-Request-Id", logId);

    if (body.stream) {
      updateRequestLog(logId, {
        statusCode: 501,
        durationMs: Date.now() - started,
        errorMessage: "Streaming responses not implemented yet",
      });
      return reply.code(501).send({ error: { message: "Streaming not supported for /v1/responses yet" } });
    }

    try {
      const prompt = responsesInputToPrompt(body.input);
      const result = await runCursorPrompt({ prompt, model });
      const responseId = `resp_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
      const payload = openAiResponsesResponse({
        id: responseId,
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
}

export async function registerFilesRoute(app: FastifyInstance): Promise<void> {
  app.post("/v1/files", async (request, reply) => {
    if (!openAiAuthOk(request.headers.authorization)) {
      return reply.code(401).send({ error: { message: "Invalid API key", type: "invalid_request_error" } });
    }

    const logId = randomUUID();
    const started = Date.now();
    createRequestLog({
      id: logId,
      method: "POST",
      path: "/v1/files",
      clientIp: request.ip,
    });
    reply.header("X-Request-Id", logId);

    try {
      const parts = request.parts();
      let purpose = "assistants";
      let filename = "upload.bin";
      let bytes = 0;
      const fileId = `file-${randomUUID().replace(/-/g, "").slice(0, 24)}`;

      mkdirSync(config.uploadDir, { recursive: true });
      const storagePath = join(config.uploadDir, fileId);
      let saved = false;

      for await (const part of parts) {
        if (part.type === "field" && part.fieldname === "purpose") {
          purpose = String(part.value);
        }
        if (part.type === "file") {
          filename = part.filename || filename;
          await pipeline(part.file, createWriteStream(storagePath));
          saved = true;
          bytes = part.file.bytesRead;
        }
      }

      if (!saved) {
        updateRequestLog(logId, {
          statusCode: 400,
          durationMs: Date.now() - started,
          errorMessage: "Missing file part",
        });
        return reply.code(400).send({ error: { message: "Missing file upload" } });
      }

      bytes = statSync(storagePath).size;

      insertUploadedFile({
        id: fileId,
        requestLogId: logId,
        purpose,
        filename,
        bytes,
        storagePath,
      });

      const payload = {
        id: fileId,
        object: "file",
        bytes,
        created_at: Math.floor(Date.now() / 1000),
        filename,
        purpose,
        status: "processed",
      };

      updateRequestLog(logId, {
        statusCode: 200,
        durationMs: Date.now() - started,
        responseBody: payload,
        fileId,
        fileName: filename,
        fileSize: bytes,
        filePurpose: purpose,
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
