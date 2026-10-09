import { Router } from "express";
import { requireAdminAuth } from "../auth/index.js";
import { telegramKeyboardDB, telegramWebAppDB } from "../../lib/db/database.js";
import { getBaleDispatcher } from "../../lib/outbox/BaleDispatcher.js";
import { BALE_WEBHOOK_SECRET } from "../config.js";
import { adminIntegrationState } from "./state.js";

export const adminRouter = Router();

// Auth travels with the router: every route below requires admin auth even if
// the router is mounted without the "/api/admin" prefix guard (#71).
adminRouter.use("/api/admin", requireAdminAuth);

// Integration Hub State (Manager Studio & Isolation)
adminRouter.get("/api/admin/integrations", (req, res) => {
  res.json({ success: true, data: adminIntegrationState });
});

adminRouter.post("/api/admin/integrations/toggle", (req, res) => {
  const { field, value } = req.body || {};
  if (field === "activeAiProvider") {
    adminIntegrationState.activeAiProvider = value;
  } else if (field && field in adminIntegrationState.pipelinePermissions) {
    (adminIntegrationState.pipelinePermissions as any)[field] = value;
  }
  res.json({ success: true, data: adminIntegrationState });
});

adminRouter.post("/api/admin/sandbox/create", (req, res) => {
  const { guestName, assignedBot } = req.body || {};
  if (!guestName) {
    return res.status(400).json({ error: "guestName is required" });
  }
  const newSandbox = {
    id: `sbx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    guestName,
    assignedBot: assignedBot || "Isolated Sandbox Bot",
    quotaUsed: "۰٪ از سهمیه",
    isolatedMemoryPath: `/sandboxes/tenant_${Date.now()}_db`,
    status: "active" as const,
  };
  adminIntegrationState.guestSandboxes.push(newSandbox);
  res.json({ success: true, sandbox: newSandbox, data: adminIntegrationState });
});

// GET Bale bot health check (admin only)
adminRouter.get("/api/admin/bale/health", async (req, res) => {
  try {
    const bale = getBaleDispatcher();
    if (!bale) {
      return res.json({ ok: false, configured: false, message: "BALE_BOT_TOKEN not set in environment." });
    }
    const health = await bale.healthCheck();
    res.json({ ok: health.ok, configured: true, botName: health.botName, botUsername: health.botUsername });
  } catch (err: any) {
    console.error("Error in /api/admin/bale/health:", err);
    res.status(500).json({ ok: false, error: err.message || "Health check failed." });
  }
});

/**
 * SSRF guard for webhook targets: only public https hosts are allowed (#73).
 */
function isPublicHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  if (host === "::1" || host === "::ffff:127.0.0.1") return false;
  if (/^127\./.test(host) || /^0\./.test(host)) return false;
  if (/^10\./.test(host) || /^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (/^(fc|fd)[0-9a-f]{0,2}:/.test(host)) return false; // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]:/.test(host)) return false; // fe80::/10 link-local
  return true;
}

// POST Set Bale Webhook URL
adminRouter.post("/api/admin/bale/set-webhook", async (req, res) => {
  try {
    const bale = getBaleDispatcher();
    if (!bale) {
      return res.status(400).json({ error: "BALE_BOT_TOKEN is not configured." });
    }
    const { webhookUrl, secretToken } = req.body || {};
    if (!webhookUrl || typeof webhookUrl !== "string") {
      return res.status(400).json({ error: "webhookUrl is required." });
    }
    const url = webhookUrl.trim();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "webhookUrl must be a valid absolute URL." });
    }
    if (parsed.protocol !== "https:") {
      return res.status(400).json({ error: "webhookUrl must use https." });
    }
    if (!isPublicHost(parsed.hostname)) {
      return res.status(400).json({ error: "webhookUrl must point to a public host." });
    }
    // An explicitly empty secretToken is rejected; an absent one falls back to
    // the configured env secret. Never silently clear the webhook secret (#73).
    if (secretToken !== undefined && (typeof secretToken !== "string" || !secretToken.trim())) {
      return res.status(400).json({ error: "secretToken must not be empty." });
    }
    const effectiveSecret =
      typeof secretToken === "string" && secretToken.trim() ? secretToken.trim() : BALE_WEBHOOK_SECRET;
    if (!effectiveSecret) {
      return res.status(400).json({
        error: "No webhook secret available: provide secretToken or configure BALE_WEBHOOK_SECRET.",
      });
    }
    const success = await bale.setWebhook(url, effectiveSecret);
    res.json({ success, webhookUrl: url });
  } catch (err: any) {
    console.error("Error in /api/admin/bale/set-webhook:", err);
    res.status(500).json({ error: err.message || "Failed to set webhook." });
  }
});

// Telegram Keyboards CRUD
adminRouter.get("/api/admin/telegram/keyboards", (req, res) => {
  const keyboards = telegramKeyboardDB.list();
  res.json({ success: true, keyboards });
});

adminRouter.post("/api/admin/telegram/keyboards", (req, res) => {
  const { id, name, schemaJson } = req.body || {};
  if (!name || !schemaJson) {
    return res.status(400).json({ error: "name and schemaJson are required" });
  }
  const kb = telegramKeyboardDB.save({ id, name, schemaJson });
  res.json({ success: true, keyboard: kb });
});

adminRouter.delete("/api/admin/telegram/keyboards/:id", (req, res) => {
  const deleted = telegramKeyboardDB.delete(req.params.id);
  res.json({ success: deleted });
});

// Telegram WebApps CRUD
adminRouter.get("/api/admin/telegram/webapps", (req, res) => {
  const webapps = telegramWebAppDB.list();
  res.json({ success: true, webapps });
});

adminRouter.post("/api/admin/telegram/webapps", (req, res) => {
  const { id, name, url, configJson } = req.body || {};
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }
  const wa = telegramWebAppDB.save({ id, name, url, configJson });
  res.json({ success: true, webapp: wa });
});

adminRouter.delete("/api/admin/telegram/webapps/:id", (req, res) => {
  const deleted = telegramWebAppDB.delete(req.params.id);
  res.json({ success: deleted });
});
