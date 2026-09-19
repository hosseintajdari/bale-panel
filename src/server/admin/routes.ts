import { Router } from "express";
import { telegramKeyboardDB, telegramWebAppDB } from "../../lib/db/database.js";
import { getBaleDispatcher } from "../../lib/outbox/BaleDispatcher.js";
import { BALE_WEBHOOK_SECRET } from "../config.js";
import { adminIntegrationState } from "./state.js";

export const adminRouter = Router();

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
    const success = await bale.setWebhook(webhookUrl.trim(), secretToken || BALE_WEBHOOK_SECRET);
    res.json({ success, webhookUrl });
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
