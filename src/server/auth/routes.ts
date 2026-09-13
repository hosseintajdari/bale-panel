import crypto from "crypto";
import { Router } from "express";
import { apiKeyDB, type UserRole } from "../../lib/db/database.js";
import { PANEL_API_SECRET } from "../config.js";
import {
  authenticateToken,
  clearSessionCookie,
  createOperatorSession,
  hashToken,
  operatorSessions,
  readCookie,
  secureEquals,
  SESSION_COOKIE_NAME,
  sessionUser,
  setSessionCookie,
} from "./session.js";

export const authRouter = Router();

authRouter.get("/api/auth/session", (req, res) => {
  const user = authenticateToken(req.headers["authorization"], req.headers.cookie);
  res.json({ authenticated: Boolean(user) });
});

authRouter.post("/api/auth/login", (req, res) => {
  const secret = typeof req.body?.secret === "string" ? req.body.secret : "";
  if (!secureEquals(secret, PANEL_API_SECRET)) {
    return res.status(401).json({ error: "Invalid operator secret." });
  }

  setSessionCookie(res, createOperatorSession());
  res.json({ authenticated: true });
});

authRouter.post("/api/auth/logout", (req, res) => {
  const sessionId = readCookie(req.headers.cookie, SESSION_COOKIE_NAME);
  if (sessionId) operatorSessions.delete(sessionId);
  clearSessionCookie(res);
  res.status(204).end();
});

// RBAC API KEY MANAGEMENT
authRouter.get("/api/admin/keys", (req, res) => {
  const keys = apiKeyDB.listKeys();
  res.json({ success: true, keys });
});

authRouter.post("/api/admin/keys", (req, res) => {
  const { name, role = "operator", tenantId = "default" } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required for API key." });
  }
  if (!["admin", "operator", "auditor"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin', 'operator', or 'auditor'." });
  }

  // Generate a random high-entropy token
  const rawToken = `emb_${role}_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = hashToken(rawToken);
  const id = `key-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  apiKeyDB.createKey({
    id,
    tokenHash,
    name: name.trim(),
    role: role as UserRole,
    tenantId: tenantId.trim(),
  });

  // Return the plaintext token once upon creation
  res.json({
    success: true,
    key: {
      id,
      name,
      role,
      tenantId,
      rawToken,
    },
  });
});

authRouter.delete("/api/admin/keys/:id", (req, res) => {
  const deleted = apiKeyDB.deleteKey(req.params.id);
  res.json({ success: deleted });
});
