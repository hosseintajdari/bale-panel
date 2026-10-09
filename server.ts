import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { adminRouter } from "./src/server/admin/index.js";
import {
  authRouter,
  requireAdminAuth,
  requireAuditorAuth,
  requireOperatorAuth,
} from "./src/server/auth/index.js";
import { botRouter } from "./src/server/bot/index.js";
import { PORT, validateStartupEnv } from "./src/server/config.js";
import { evolutionRouter } from "./src/server/evolution/index.js";
import { gatewayRouter } from "./src/server/gateways/index.js";
import { ledgerRouter } from "./src/server/ledger/index.js";
import { pipelineRouter } from "./src/server/pipeline/index.js";
import { vaultRouter } from "./src/server/vault/index.js";
import { webhookRouter } from "./src/server/webhooks/index.js";
import db from "./src/lib/db/database.js";

// Validate environment variables on startup
validateStartupEnv();

export const app = express();

// Security headers (#72): Helmet-equivalent set implemented dependency-free.
// The CSP is tuned for the Vite SPA: 'unsafe-inline' is required because Vite
// injects inline module scripts and HMR; data:/blob: cover in-app image previews.
// (Deliberately no helmet dependency: the header set is small, fully visible,
// and adds no supply-chain surface for a single-purpose server.)
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' ws: wss:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  next();
});

// Base Middleware
// Tight body limit for auth endpoints: login/session payloads are tiny, so the
// 20 MB global limit (needed for bot image payloads) must not apply here (#70).
// body-parser skips re-parsing (req._body), so the first matching limit wins.
app.use("/api/auth", express.json({ limit: "100kb" }));
app.use(express.json({ limit: "20mb" }));

// ─────────────────────────────────────────────────────────────────────────────
// AUTH GUARDS (Admin, Operator, Auditor)
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api/admin", requireAdminAuth);
app.use("/api/pipeline", requireOperatorAuth);
app.use("/api/gateways", requireAuditorAuth);
app.use("/api/system", requireAdminAuth);
app.use("/api/evolution", requireOperatorAuth);
app.use("/api/ledger", requireOperatorAuth);

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN ROUTERS
// ─────────────────────────────────────────────────────────────────────────────
app.use(authRouter);
app.use(vaultRouter);
app.use(pipelineRouter);
app.use(gatewayRouter);
app.use(evolutionRouter);
app.use(ledgerRouter);
app.use(adminRouter);
app.use(botRouter);
app.use(webhookRouter);

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE & SERVER BOOTSTRAP
// ─────────────────────────────────────────────────────────────────────────────
export async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "Not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`Gemini Bot Studio running on http://127.0.0.1:${PORT}`);
  });

  // Graceful shutdown lifecycle management (#89): stop accepting new
  // connections, wait for in-flight requests, then close the SQLite handle.
  // A timeout forces exit so a hung connection can't block shutdown forever.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
    const forceTimer = setTimeout(() => {
      console.error("[SHUTDOWN] Graceful shutdown timed out after 10s; forcing exit.");
      try {
        db.close();
      } catch {
        // Already closed or never opened — nothing more to do.
      }
      process.exit(1);
    }, 10_000);
    forceTimer.unref();
    server.close(() => {
      clearTimeout(forceTimer);
      console.log("[SHUTDOWN] HTTP server closed. Closing SQLite handle...");
      try {
        db.close();
        console.log("[SHUTDOWN] SQLite handle closed.");
      } catch (err) {
        console.error("[SHUTDOWN] Failed to close SQLite handle:", err);
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

// Start server if executed directly as entrypoint
const isMain = Boolean(
  process.argv[1] &&
    (process.argv[1].endsWith("server.ts") ||
      process.argv[1].endsWith("server.cjs") ||
      process.argv[1].endsWith("server.js"))
);

if (isMain && process.env.NODE_ENV !== "test") {
  startServer();
}
