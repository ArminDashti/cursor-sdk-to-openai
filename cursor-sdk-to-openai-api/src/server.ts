import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { config } from "./config.js";
import { closeDb, getDb, startRetentionScheduler } from "./db.js";
import { registerAdminRoutes, registerHealthRoute } from "./routes/admin.js";
import { registerChatRoutes } from "./routes/openai.js";
import { registerFilesRoute, registerResponsesRoute } from "./routes/responses-files.js";
import { purgeExpiredLogs } from "./store/purge.js";

async function main(): Promise<void> {
  getDb();
  const purge = purgeExpiredLogs();
  console.log(
    `retention: keeping ${config.logRetentionDays} days (purged ${purge.deletedLogs} logs, ${purge.deletedFiles} files on startup)`,
  );

  const retentionTimer = startRetentionScheduler();

  const app = Fastify({
    logger: true,
    bodyLimit: 20 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: [config.webuiOrigin],
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  await registerHealthRoute(app);
  await registerChatRoutes(app);
  await registerResponsesRoute(app);
  await registerFilesRoute(app);
  await registerAdminRoutes(app);

  const shutdown = async () => {
    clearInterval(retentionTimer);
    await app.close();
    closeDb();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: config.port, host: config.host });
  console.log(`OpenAI-compatible API listening on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
