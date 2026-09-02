import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config, readMigration } from "./config.js";
import { purgeExpiredLogs } from "./store/purge.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  mkdirSync(dirname(config.databasePath), { recursive: true });
  db = new Database(config.databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(readMigration("001_init.sql"));
  purgeExpiredLogs(db);

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function startRetentionScheduler(): NodeJS.Timeout {
  const intervalMs = 24 * 60 * 60 * 1000;
  return setInterval(() => {
    try {
      purgeExpiredLogs(getDb());
    } catch (err) {
      console.error("retention purge failed:", err);
    }
  }, intervalMs);
}
