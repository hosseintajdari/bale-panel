import crypto from "crypto";
import type express from "express";
import { apiKeyDB } from "../../lib/db/database.js";
import { PANEL_API_SECRET } from "../config.js";
import type { AuthenticatedUser } from "./types.js";

export const SESSION_COOKIE_NAME = "bale_panel_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const operatorSessions = new Map<string, number>();

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

export function createOperatorSession(): string {
  const sessionId = crypto.randomBytes(32).toString("base64url");
  operatorSessions.set(sessionId, Date.now() + SESSION_TTL_MS);
  return sessionId;
}

export function sessionUser(cookieHeader = ""): AuthenticatedUser | null {
  const sessionId = readCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!sessionId) return null;
  const expiresAt = operatorSessions.get(sessionId);
  if (!expiresAt || expiresAt <= Date.now()) {
    if (sessionId) operatorSessions.delete(sessionId);
    return null;
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
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
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
