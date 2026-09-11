import axios from "axios";
import { auditDB } from "../../lib/db/database.js";
import { getBaleDispatcher } from "../../lib/outbox/BaleDispatcher.js";

export async function dispatchToOutbox(channel: string, targetId: string, message: string): Promise<boolean> {
  const dispatchId = `dsp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  console.log(`[OUTBOX] ${channel.toUpperCase()} -> ${targetId} | ${message.slice(0, 60)}...`);

  let success = false;
  let errorMsg = "";

  try {
    if (process.env.MOCK_OUTBOX === "true" || (channel === "bale" && process.env.BALE_MOCK_DISPATCH === "true")) {
      console.log(`[OUTBOX MOCK] ${channel.toUpperCase()} -> ${targetId} | ${message.slice(0, 60)}...`);
      success = true;
    } else if (channel === "bale") {
      const bale = getBaleDispatcher();
      if (bale) {
        // Send typing indicator first (best-effort, no await)
        bale.sendTyping(targetId).catch(() => {});
        const result = await bale.sendText(targetId, message);
        success = result.ok;
        if (!result.ok) errorMsg = result.error || "Bale dispatch failed";
      } else {
        console.warn("[OUTBOX] BALE_BOT_TOKEN not configured — message logged only.");
        success = false;
        errorMsg = "BALE_BOT_TOKEN not set";
      }
    } else if (channel === "whatsapp") {
      // Evolution API v2 integration
      const evolutionBaseUrl = process.env.EVOLUTION_API_URL;
      const evolutionApiKey = process.env.EVOLUTION_API_KEY;
      const instanceName = process.env.EVOLUTION_INSTANCE || "embednet-wa-primary";
      if (evolutionBaseUrl && evolutionApiKey) {
        const resp = await axios.post<any>(
          `${evolutionBaseUrl}/message/sendText/${instanceName}`,
          { number: targetId, text: message },
          { headers: { apikey: evolutionApiKey }, timeout: 10000 }
        );
        success = resp.status === 200 || resp.status === 201;
        if (!success) {
          errorMsg = resp.data?.message || `HTTP ${resp.status}`;
        }
      } else {
        console.warn("[OUTBOX] EVOLUTION_API_URL/KEY not configured — WhatsApp dispatch skipped.");
        success = false;
        errorMsg = "EVOLUTION_API config missing";
      }
    } else if (channel === "telegram") {
      // Telegram Bot API
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      if (telegramToken) {
        const resp = await axios.post<any>(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          { chat_id: targetId, text: message, parse_mode: "Markdown" },
          { timeout: 10000 }
        );
        success = resp.data?.ok === true;
        if (!success) {
          errorMsg = resp.data?.description || "Telegram dispatch failed";
        }
      } else {
        console.warn("[OUTBOX] TELEGRAM_BOT_TOKEN not configured.");
        success = false;
        errorMsg = "TELEGRAM_BOT_TOKEN not set";
      }
    } else {
      // SMS or unknown: log only
      console.log(`[OUTBOX][${channel.toUpperCase()}] Dispatch not implemented. Target: ${targetId}`);
      success = true; // Treat as no-op success for SMS (handled by external provider)
    }
  } catch (err: any) {
    errorMsg = err?.response?.data?.description || err?.message || "Dispatch error";
    console.error(`[OUTBOX ERROR] ${channel}:`, err?.message || err);
  }

  // Persist audit event
  try {
    auditDB.insert({
      id: dispatchId,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      dateFormatted: now.toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      channelId: channel,
      channelName: channel === "whatsapp" ? "واتساپ" : channel === "bale" ? "بله" : channel === "telegram" ? "تلگرام" : "پیامک",
      eventType: "outbox_dispatch",
      severity: success ? "success" : "warning",
      summary: success
        ? `ارسال موفق پیام به ${channel.toUpperCase()} → ${targetId}`
        : `ارسال ناموفق به ${channel.toUpperCase()}: ${errorMsg}`,
      details: `Message (${message.length} chars): ${message.slice(0, 100)}`,
      triggeredBy: "inbound_webhook",
    });
  } catch { /* audit logging is best-effort */ }

  return success;
}
