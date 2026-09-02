import type Database from "better-sqlite3";
import { existsSync, unlinkSync } from "node:fs";
import { config } from "../config.js";
import { getDb } from "../db.js";

export type PurgeResult = {
  deletedLogs: number;
  deletedFiles: number;
};

export function purgeExpiredLogs(database?: Database.Database): PurgeResult {
  const db = database ?? getDb();
  const cutoff = new Date(Date.now() - config.logRetentionDays * 24 * 60 * 60 * 1000).toISOString();

  const expiredFiles = db
    .prepare(
      `SELECT id, storage_path FROM uploaded_files WHERE created_at < ?`,
    )
    .all(cutoff) as Array<{ id: string; storage_path: string }>;

  for (const file of expiredFiles) {
    if (existsSync(file.storage_path)) {
      try {
        unlinkSync(file.storage_path);
      } catch {
        /* ignore missing file */
      }
    }
  }

  const deleteFiles = db.prepare(`DELETE FROM uploaded_files WHERE created_at < ?`).run(cutoff);
  const deleteLogs = db.prepare(`DELETE FROM api_request_logs WHERE created_at < ?`).run(cutoff);

  return {
    deletedLogs: deleteLogs.changes,
    deletedFiles: deleteFiles.changes,
  };
}
