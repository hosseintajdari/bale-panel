import crypto from "crypto";
import type express from "express";
import { apiKeyDB } from "../../lib/db/database.js";
import { PANEL_API_SECRET } from "../config.js";
import type { AuthenticatedUser } from "./types.js";

export const SESSION_COOKIE_NAME = "bale_panel_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface SessionRecord {
  expiresAt: number;
  user: AuthenticatedUser;
}

export const operatorSessions = new Map<string, number | SessionRecord>();

/**
 * Drop expired sessions so the in-memory map can't grow unbounded (#68).
 * Expired entries were previously only removed lazily on access.
 */
export function sweepExpiredSessions(now: number = Date.now()): number {
  let removed = 0;
  for (const [id, entry] of operatorSessions) {
    const expiresAt = typeof entry === "number" ? entry : entry.expiresAt;
    if (!expiresAt || expiresAt <= now) {
      operatorSessions.delete(id);
      removed++;
    }
  }
  return removed;
}

// Run the sweeper every 15 minutes; unref'd so it never keeps the process alive.
const sessionSweepTimer = setInterval(() => sweepExpiredSessions(), 15 * 60 * 1000);
if (typeof (sessionSweepTimer as any).unref === "function") {
  (sessionSweepTimer as any).unref();
}

export function secureEquals(left: string, right: string): boolean {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const hashLeft = crypto.createHash("sha256").update(left).digest();
  const hashRight = crypto.createHash("sha256").update(right).digest();
  return crypto.timingSafeEqual(hashLeft, hashRight);
}

export function readCookie(cookieHeader = "", name: string): string | null {
  for (const cookie of cookieHeader.split(";")) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export function createOperatorSession(user?: AuthenticatedUser): string {
  const sessionId = crypto.randomBytes(32).toString("base64url");
  const sessionUserRecord: AuthenticatedUser = user || { role: "admin", tenantId: "system", name: "Local Operator" };
  operatorSessions.set(sessionId, {
    expiresAt: Date.now() + SESSION_TTL_MS,
    user: sessionUserRecord,
  });
  return sessionId;
}

export function sessionUser(cookieHeader = ""): AuthenticatedUser | null {
  const sessionId = readCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!sessionId) return null;
  const entry = operatorSessions.get(sessionId);
  if (!entry) return null;

  const expiresAt = typeof entry === "number" ? entry : entry.expiresAt;
  if (!expiresAt || expiresAt <= Date.now()) {
    operatorSessions.delete(sessionId);
    return null;
  }

  if (typeof entry === "object" && entry.user) {
    return entry.user;
  }
  return { role: "admin", tenantId: "system", name: "Local Operator" };
}

export function setSessionCookie(res: express.Response, sessionId: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
  );
}

export function clearSessionCookie(res: express.Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function authenticateToken(authHeader = "", cookieHeader = ""): AuthenticatedUser | null {
  const session = sessionUser(cookieHeader);
  if (session) return session;

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  // Master key bypass (Super Admin)
  if (secureEquals(token, PANEL_API_SECRET)) {
    return { role: "admin", tenantId: "system", name: "SuperAdmin (Master Key)" };
  }

  // Check DB keys
  const tokenHash = hashToken(token);
  const check = apiKeyDB.validateKey(tokenHash);
  if (check.valid && check.role) {
    return { role: check.role, tenantId: check.tenantId || "default", name: check.name || "API Client" };
  }

  return null;
}
