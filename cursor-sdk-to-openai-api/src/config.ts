import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: envInt("PORT", 8140),
  host: process.env.HOST ?? "127.0.0.1",
  databasePath: process.env.DATABASE_PATH ?? "./data/cursor-sdk-to-openai.db",
  // Prefer work account; keep older aliases for compose/.env
  cursorApiKey:
    process.env.CURSOR_API_KEY_RAMIN_DASHTI_WORK ||
    process.env.RAMIN_2_CURSOR_API ||
    process.env.CURSOR_API_KEY ||
    "",
  // Empty CURSOR_CWD= must not win over cwd (?? only treats null/undefined)
  cursorCwd: process.env.CURSOR_CWD?.trim() || process.cwd(),
  defaultModel: process.env.DEFAULT_MODEL ?? "composer-2.5",
  authKey: process.env.AUTH_KEY ?? "",
  adminUsername: process.env.ADMIN_USERNAME ?? "armin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "dopadopa123",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  cursorIncludeThinking: (process.env.CURSOR_INCLUDE_THINKING ?? "true") === "true",
  uploadDir: process.env.UPLOAD_DIR ?? "./data/uploads",
  logResponseMaxBytes: envInt("LOG_RESPONSE_MAX_BYTES", 65536),
  logRetentionDays: envInt("LOG_RETENTION_DAYS", 30),
  webuiOrigin: process.env.WEBUI_ORIGIN ?? "http://127.0.0.1:5190",
  webuiOrigins: (process.env.WEBUI_ORIGIN ?? "http://127.0.0.1:5190")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export function projectRoot(): string {
  return join(__dirname, "..");
}

export function readMigration(name: string): string {
  return readFileSync(join(projectRoot(), "migrations", name), "utf8");
}
