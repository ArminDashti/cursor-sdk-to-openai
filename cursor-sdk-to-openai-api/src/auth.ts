import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromB64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signAdminToken(username: string): string {
  const payload = JSON.stringify({
    sub: username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const body = b64url(payload);
  const sig = createHmac("sha256", config.jwtSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyAdminToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = createHmac("sha256", config.jwtSecret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromB64url(body)) as { sub?: string; exp?: number };
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === config.adminUsername && password === config.adminPassword;
}

export function extractBearer(header?: string): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export function openAiAuthOk(header?: string): boolean {
  if (!config.authKey) return true;
  return extractBearer(header) === config.authKey;
}
