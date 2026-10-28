import { Router } from "express";
import { auditDB } from "../../lib/db/database.js";
import { secureEquals } from "../auth/index.js";
import { BALE_BOT_TOKEN, EVOLUTION_WEBHOOK_SECRET, getBaleWebhookSecret } from "../config.js";
import { processPipelineMessage, shadowEventBus } from "../pipeline/index.js";

export const webhookRouter = Router();

// Evolution API v2 Real Webhook Endpoint (For WhatsApp)
webhookRouter.post("/webhook/evolution", async (req, res) => {
  // Evolution webhooks must include the custom header configured on the instance.
  // Fail closed so an unset deployment secret cannot expose the ingestion pipeline.
  if (!EVOLUTION_WEBHOOK_SECRET) {
    console.error("[EVOLUTION WEBHOOK] EVOLUTION_WEBHOOK_SECRET is not configured; request rejected.");
    return res.status(403).json({ error: "Forbidden" });
  }

  const incomingSecret = typeof req.headers["x-evolution-webhook-secret"] === "string"
    ? req.headers["x-evolution-webhook-secret"]
    : "";
  if (!secureEquals(incomingSecret, EVOLUTION_WEBHOOK_SECRET)) {
    console.warn("[EVOLUTION WEBHOOK] Secret token mismatch — request rejected.");
    return res.status(403).json({ error: "Forbidden" });
  }

  // Acknowledge webhook quickly to avoid timeout, after authenticating it.
  res.status(200).json({ status: "received" });

  try {
    // 1. Universal Ingest Adapter
    const payload = req.body;

    // Check if it's a message event
    if (payload?.event !== "messages.upsert") return;

    const message = payload?.data?.messages?.[0];
    if (!message || message.key.fromMe) return;

    const senderId = message.key.remoteJid;
    const senderDisplay = message.pushName || senderId;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || "";

    if (!text) return;

    // Dispatch internally to pipeline process
    const pipelineResult = await processPipelineMessage("whatsapp", senderId, senderDisplay, text, "WhatsApp User", "live");
    shadowEventBus.emit("shadow-update", {
      type: "new",
      record: pipelineResult.record,
      trace: pipelineResult.trace,
    });
  } catch (error) {
    console.error("Evolution API Webhook Error:", error);
  }
});

// BALE WEBHOOK ENDPOINT — Receives real messages from Bale Bot API
webhookRouter.post("/webhook/bale", async (req, res) => {
  const configuredSecret = getBaleWebhookSecret();
  // Fail closed: an unset deployment secret must never expose the ingestion pipeline.
  if (!configuredSecret) {
    console.error("[BALE WEBHOOK] BALE_WEBHOOK_SECRET is not configured; request rejected.");
    return res.status(403).json({ error: "Forbidden" });
  }

  const incomingSecret = typeof req.headers["x-telegram-bot-api-secret-token"] === "string"
    ? req.headers["x-telegram-bot-api-secret-token"]
    : "";
  if (!secureEquals(incomingSecret, configuredSecret)) {
    console.warn("[BALE WEBHOOK] Secret token mismatch — request rejected.");
    return res.status(403).json({ error: "Forbidden" });
  }

  // Acknowledge immediately
  res.status(200).json({ ok: true });

  try {
    const update = req.body;
    const message = update?.message;
    if (!message) return;

    const chatId = String(message.chat?.id || message.from?.id || "");
    const senderName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "کاربر بله";
    const text: string = message.text || message.caption || "";

    if (!text.trim() || !chatId) return;

    console.log(`[BALE WEBHOOK] From: ${chatId} (${senderName}) | Text: ${text.slice(0, 60)}`);

    // Record inbound event to audit log
    const now = new Date();
    try {
      auditDB.insert({
        id: `bale-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now.toISOString(),
        timeFormatted: now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        dateFormatted: now.toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
        channelId: "bale",
        channelName: "پیام‌رسان بله (Bale Hook)",
        eventType: "inbound_message",
        severity: "info",
        summary: `پیام ورودی از بله: ${senderName} (${chatId})`,
        details: text.slice(0, 200),
        triggeredBy: "inbound_webhook",
      });
    } catch (auditErr) {
      console.warn("[BALE WEBHOOK] Failed to record audit entry:", auditErr);
    }

    // Determine domain context: clinical/medical query vs personal
    const isClinical = /دارو|درمان|نسخه|بیمار|قرص|کپسول|تشنج|بیهوش|خونریزی|ivig|rare|قیمت/i.test(text) || text.startsWith("/");
    const domainContext = isClinical ? "Clinical" : "Personal";

    // Run through pipeline
    const pipelineResult = await processPipelineMessage("bale", chatId, senderName, text, domainContext, "shadow");
    shadowEventBus.emit("shadow-update", {
      type: "new",
      record: pipelineResult.record,
      trace: pipelineResult.trace,
    });
  } catch (err) {
    console.error("[BALE WEBHOOK ERROR]:", err);
  }
});
