import crypto from "crypto";
import { Router } from "express";
import { requireAdminAuth } from "./middleware.js";
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

// The /api/admin/keys routes below live on this router: require admin auth at
// the router level so the guard travels with it (#71).
authRouter.use("/api/admin", requireAdminAuth);

authRouter.get("/api/auth/session", (req, res) => {
  const user = authenticateToken(req.headers["authorization"], req.headers.cookie);
  res.json({
    authenticated: Boolean(user),
    ...(user ? { role: user.role, name: user.name, tenantId: user.tenantId } : {}),
  });
});

authRouter.post("/api/auth/login", (req, res) => {
  const secret = typeof req.body?.secret === "string" ? req.body.secret.trim() : "";
  if (!secret) {
    return res.status(401).json({ error: "Invalid operator secret or admin key." });
  }

  let user: { role: UserRole; tenantId: string; name: string } | null = null;

  if (secureEquals(secret, PANEL_API_SECRET)) {
    user = { role: "admin", tenantId: "system", name: "SuperAdmin (Master Key)" };
  } else {
    const tokenHash = hashToken(secret);
    const check = apiKeyDB.validateKey(tokenHash);
    if (check.valid && check.role === "admin") {
      user = {
        role: "admin",
        tenantId: check.tenantId || "default",
        name: check.name || "Admin API Client",
      };
    }
  }

  if (!user) {
    return res.status(401).json({ error: "Invalid operator secret or admin key." });
  }

  setSessionCookie(res, createOperatorSession(user));
  res.json({ authenticated: true, role: user.role, name: user.name, tenantId: user.tenantId });
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
  const { name, role = "operator", tenantId = "default" } = req.body || {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required for API key." });
  }
  if (!["admin", "operator", "auditor"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin', 'operator', or 'auditor'." });
  }

  const cleanTenantId = typeof tenantId === "string" && tenantId.trim() ? tenantId.trim() : "default";

  // Generate a random high-entropy token
  // Role-neutral prefix: the privilege level lives only in the server-side
  // key record, never in the token string itself (#74).
  const rawToken = `emb_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = hashToken(rawToken);
  const id = `key-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  apiKeyDB.createKey({
    id,
    tokenHash,
    name: name.trim(),
    role: role as UserRole,
    tenantId: cleanTenantId,
  });

  // Return the plaintext token once upon creation
  res.json({
    success: true,
    key: {
      id,
      name: name.trim(),
      role,
      tenantId: cleanTenantId,
      rawToken,
    },
  });
});

authRouter.delete("/api/admin/keys/:id", (req, res) => {
  const deleted = apiKeyDB.deleteKey(req.params.id);
  res.json({ success: deleted });
});
