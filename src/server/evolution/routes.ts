import { Router } from "express";
import { globalPrivacySettings, serverLedgerItems } from "../ledger/index.js";
import { processPipelineMessage, shadowEventBus } from "../pipeline/index.js";
import { evolutionInstanceState } from "./state.js";

export const evolutionRouter = Router();

// Evolution API State Endpoints
evolutionRouter.get("/api/evolution/status", (req, res) => {
  res.json({
    success: true,
    instance: evolutionInstanceState,
  });
});

// Generate 8-digit Pairing Code (Pair without camera/QR)
evolutionRouter.post("/api/evolution/pair-code", (req, res) => {
  const { phoneNumber } = req.body || {};
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return res.status(400).json({ error: "شماره تلفن الزامی است." });
  }

  // Generate 8-character code in Evolution API format (e.g., 4K9L-2M8P)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  const generatedCode = `${part1}-${part2}`;

  evolutionInstanceState.connectedPhone = phoneNumber.trim();
  evolutionInstanceState.pairingCode = generatedCode;
  evolutionInstanceState.status = "connecting";

  res.json({
    success: true,
    pairingCode: generatedCode,
    phoneNumber: phoneNumber.trim(),
    instructions: [
      "۱. در واتساپ گوشی به منوی سه نقطه یا Settings بروید.",
      "۲. گزینه Linked Devices (دستگاه‌های متصل) و سپس Link a Device را بزنید.",
      "۳. در پایین صفحه روی 'Link with phone number instead' (اتصال با شماره تلفن) تپ کنید.",
      `۴. کد ${generatedCode} را در گوشی وارد کنید.`
    ],
  });
});

// Refresh QR Code
evolutionRouter.post("/api/evolution/qr-refresh", (req, res) => {
  evolutionInstanceState.qrExpiresInSec = 20;
  evolutionInstanceState.status = "qrcode_ready";
  res.json({
    success: true,
    qrExpiresInSec: 20,
    message: "کیو‌آر کد جدید صادر شد.",
  });
});

// Switch Mode (Personal Notebook vs Pharmacy Inbound)
evolutionRouter.post("/api/evolution/mode", (req, res) => {
  const { mode } = req.body || {};
  if (mode !== "personal_notebook" && mode !== "pharmacy_inbound") {
    return res.status(400).json({ error: "مد نامعتبر است." });
  }
  evolutionInstanceState.mode = mode;
  res.json({ success: true, mode: evolutionInstanceState.mode });
});

// Update Anti-Ban Configuration
evolutionRouter.post("/api/evolution/antiban", (req, res) => {
  const { strictInboundOnly, persistLedgerFirst, humanJitterMinSec, humanJitterMaxSec, simulateComposingPresence } = req.body || {};
  if (typeof strictInboundOnly === "boolean") evolutionInstanceState.antiBan.strictInboundOnly = strictInboundOnly;
  if (typeof persistLedgerFirst === "boolean") evolutionInstanceState.antiBan.persistLedgerFirst = persistLedgerFirst;
  if (typeof humanJitterMinSec === "number") evolutionInstanceState.antiBan.humanJitterMinSec = humanJitterMinSec;
  if (typeof humanJitterMaxSec === "number") evolutionInstanceState.antiBan.humanJitterMaxSec = humanJitterMaxSec;
  if (typeof simulateComposingPresence === "boolean") evolutionInstanceState.antiBan.simulateComposingPresence = simulateComposingPresence;

  res.json({ success: true, antiBan: evolutionInstanceState.antiBan });
});

// Inbound Message Handler with Anti-Ban & Persist-First Protocol
evolutionRouter.post("/api/evolution/inbound-message", async (req, res) => {
  try {
    const {
      senderPhone = "+989123456789",
      senderName = "بیمار / کاربر واتساپ",
      messageText,
      isInitiatedByCounterparty = true, // Must be true to pass anti-ban
    } = req.body || {};

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ error: "متن پیام الزامی است." });
    }

    const trimmed = messageText.trim();
    const isPharmacy = evolutionInstanceState.mode === "pharmacy_inbound";

    // 1. Anti-Ban Validation: Strict Inbound Only
    if (isPharmacy && evolutionInstanceState.antiBan.strictInboundOnly && !isInitiatedByCounterparty) {
      return res.status(403).json({
        error: "توقف توسط سپر ضد بلاک: ارسال پیام آغازگر (Cold Outreach) در واتساپ داروخانه ممنوع است تا خطر مسدودی به صفر برسد.",
        antiBanViolation: "STRICT_INBOUND_REQUIRED",
      });
    }

    // 2. Data Privacy & Retention Check: WorkLedger logging vs Ephemeral sessions
    let persistedLedgerId: string | null = null;
    const isMedicalOrPharmacy = isPharmacy || /دارو|درمان|نسخه|بیمار|قند|فشار|پزشک|کلینیک|قرص|کپسول/.test(trimmed);
    const shouldKeepEphemeral = globalPrivacySettings.retentionPolicy === "ephemeral" && isMedicalOrPharmacy;

    if (shouldKeepEphemeral) {
      // High-privacy Medical / Professional mode: Keep sessions strictly ephemeral, DO NOT persist into WorkLedger
      globalPrivacySettings.ephemeralSessionsCount += 1;
      persistedLedgerId = null;
    } else if (evolutionInstanceState.antiBan.persistLedgerFirst) {
      // Audited mode: Log interaction metadata for the WorkLedger
      persistedLedgerId = `wld-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const ledgerEntry = {
        id: persistedLedgerId,
        title: isPharmacy
          ? `پیام ورودی داروخانه: ${senderPhone}`
          : `یادداشت چت شخصی: ${trimmed.slice(0, 30)}...`,
        domainCategory: (isPharmacy ? "Clinical" : "Personal") as any,
        summary: trimmed,
        activeContext: `WhatsApp Inbound (Evolution API) -> ${isPharmacy ? "قوانین ضد بلاک فعال" : "چت شخصی"}`,
        tasksPending: 1,
        lastUpdated: "اکنون",
        tokenLoad: `${Math.round(trimmed.length * 1.3)} توکن`,
      };
      serverLedgerItems.unshift(ledgerEntry);
      evolutionInstanceState.lastPersistedLedgerId = persistedLedgerId;
      globalPrivacySettings.loggedSessionsCount += 1;
    }

    // 3. Calculate Anti-Ban Human Jitter Delay & Typing Presence
    const minSec = evolutionInstanceState.antiBan.humanJitterMinSec;
    const maxSec = evolutionInstanceState.antiBan.humanJitterMaxSec;
    const jitterSec = parseFloat((Math.random() * (maxSec - minSec) + minSec).toFixed(1));

    // 4. Process Message via Core Pipeline
    const domain = isPharmacy ? "Clinical" : "Personal";
    const pipelineResult = await processPipelineMessage("whatsapp", senderPhone, senderName, trimmed, domain, "shadow");

    evolutionInstanceState.lastInboundAt = "اکنون";
    evolutionInstanceState.antiBan.messagesSentToday += 1;

    // Broadcast newly created shadow record to real-time SSE stream clients
    shadowEventBus.emit("shadow-update", {
      type: "new",
      record: pipelineResult.record,
      trace: pipelineResult.trace,
    });

    res.json({
      success: true,
      antiBanPassed: true,
      persistedInLedgerId: persistedLedgerId,
      retentionPolicy: globalPrivacySettings.retentionPolicy,
      isEphemeral: shouldKeepEphemeral,
      humanJitterDelaySec: jitterSec,
      typingPresenceSent: evolutionInstanceState.antiBan.simulateComposingPresence,
      reply: pipelineResult.record.proposedReply,
      shadowRecord: pipelineResult.record,
      trace: pipelineResult.trace,
    });
  } catch (err: any) {
    console.error("Inbound message processing failed:", err);
    res.status(500).json({ error: err.message || "خطا در پردازش پیام ورودی." });
  }
});
