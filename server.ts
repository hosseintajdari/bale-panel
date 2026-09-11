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

// Validate environment variables on startup
validateStartupEnv();

export const app = express();

// Base Middleware
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gemini Bot Studio running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown lifecycle management
  const shutdown = (signal: string) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
    server.close(() => {
      console.log("[SHUTDOWN] HTTP server closed.");
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
