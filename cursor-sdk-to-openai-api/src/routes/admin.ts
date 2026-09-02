import type { FastifyInstance } from "fastify";
import { extractBearer, signAdminToken, validateAdminCredentials, verifyAdminToken } from "../auth.js";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { ENDPOINT_CATALOG } from "./endpoints-catalog.js";
import { getRequestLog, listRequestLogs } from "../store/repository.js";
import { purgeExpiredLogs } from "../store/purge.js";

function requireAdmin(request: { headers: { authorization?: string } }): string | null {
  const token = extractBearer(request.headers.authorization);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.post("/admin/auth/login", async (request, reply) => {
    const body = request.body as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return reply.code(400).send({ error: "username and password required" });
    }
    if (!validateAdminCredentials(body.username, body.password)) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }
    return reply.send({ token: signAdminToken(body.username) });
  });

  app.get("/admin/endpoints", async (request, reply) => {
    if (!requireAdmin(request)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    return reply.send({ endpoints: ENDPOINT_CATALOG });
  });

  app.get("/admin/logs", async (request, reply) => {
    if (!requireAdmin(request)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const q = request.query as {
      page?: string;
      page_size?: string;
      path?: string;
      status?: string;
      model?: string;
    };

    const page = Math.max(1, Number.parseInt(q.page ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(q.page_size ?? "20", 10) || 20));
    const status = q.status ? Number.parseInt(q.status, 10) : undefined;

    const result = listRequestLogs({
      page,
      pageSize,
      path: q.path,
      status: Number.isFinite(status) ? status : undefined,
      model: q.model,
    });

    return reply.send({
      page,
      page_size: pageSize,
      total: result.total,
      items: result.items,
      retention_days: config.logRetentionDays,
    });
  });

  app.get("/admin/logs/:id", async (request, reply) => {
    if (!requireAdmin(request)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { id } = request.params as { id: string };
    const row = getRequestLog(id);
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send(row);
  });

  app.post("/admin/purge", async (request, reply) => {
    if (!requireAdmin(request)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const result = purgeExpiredLogs(getDb());
    return reply.send({ ...result, retention_days: config.logRetentionDays });
  });
}

export async function registerHealthRoute(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    try {
      getDb().prepare("SELECT 1").get();
      return reply.send({
        status: "ok",
        retention_days: config.logRetentionDays,
        database: config.databasePath,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "db error";
      return reply.code(503).send({ status: "error", message });
    }
  });
}
