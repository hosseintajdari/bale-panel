import { Router } from "express";
import { shadowDB, type ShadowRecord } from "../../lib/db/database.js";
import { gatewayPulseConfig, getChannelsWithTelemetry } from "../gateways/index.js";
import { globalPrivacySettings } from "../ledger/index.js";
import { dispatchToOutbox } from "../outbox/index.js";
import { processPipelineMessage } from "./engine.js";

export const pipelineRouter = Router();

pipelineRouter.get("/api/pipeline/state", (req, res) => {
  const queue = shadowDB.getAll();
  res.json({
    status: "operational",
    environment: "Embednet OS Core v4.2 (LangBot Modular Pattern + SQLite Persistence)",
    privacySettings: globalPrivacySettings,
    pulseConfig: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    shadowQueue: queue,
    stats: {
      totalProcessed: 1428,
      shadowIntercepted: queue.length,
      autoApprovedSafe: 1290,
      rejectedOrRedline: 27,
      ephemeralSessions: globalPrivacySettings.ephemeralSessionsCount,
      auditedSessions: globalPrivacySettings.loggedSessionsCount,
    },
  });
});

// Ingest Shadow Trace from Backend Engines
pipelineRouter.post("/api/pipeline/ingest/shadow-trace", (req, res) => {
  try {
    const { engine_id, shadow_item } = req.body || {};
    if (!engine_id || typeof engine_id !== "string" || !shadow_item || typeof shadow_item !== "object") {
      return res.status(400).json({ error: "Missing or invalid required fields: engine_id and shadow_item" });
    }

    const record: ShadowRecord = {
      id: shadow_item.id || `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: shadow_item.sessionId || engine_id,
      channel: shadow_item.channel || "bale",
      senderDisplay: shadow_item.senderDisplay || engine_id,
      userMessage: shadow_item.userMessage || "",
      proposedReply: shadow_item.proposedReply || "",
      timestamp: shadow_item.timestamp || new Date().toISOString(),
      confidenceScore: shadow_item.confidenceScore || 0.9,
      riskLevel: shadow_item.riskLevel || "safe",
      status: shadow_item.status || "pending",
      deterministicRuleApplied: shadow_item.deterministicRuleApplied,
      auditNote: shadow_item.auditNote,
      editedReply: shadow_item.editedReply,
    };

    shadowDB.insert(record);

    res.json({ success: true, message: "Shadow record ingested." });
  } catch (err: any) {
    console.error("Error ingesting shadow trace:", err);
    res.status(500).json({ error: err.message });
  }
});

pipelineRouter.post("/api/pipeline/process", async (req, res) => {
  try {
    const {
      channel = "whatsapp",
      senderId = "operator-console",
      senderDisplay = "کاربر تستی / مدیر",
      text,
      domainContext = "Executive",
      environmentMode = "shadow",
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required." });
    }

    const result = await processPipelineMessage(channel, senderId, senderDisplay, text, domainContext, environmentMode);

    res.json({
      success: true,
      shadowRecord: result.record,
      trace: result.trace,
    });
  } catch (err: any) {
    console.error("Error in /api/pipeline/process:", err);
    res.status(500).json({ error: err.message || "Pipeline processing failed." });
  }
});

pipelineRouter.post("/api/pipeline/shadow/action", async (req, res) => {
  try {
    const { id, action, editedReply } = req.body || {};
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Shadow item id is required." });
    }
    const item = shadowDB.getById(id);
    if (!item) {
      return res.status(404).json({ error: "Shadow item not found." });
    }

    let updatedItem = item;

    if (action === "approve") {
      const auditNote = `تایید و به خروجی ${item.channel.toUpperCase()} ارسال شد.`;
      const chatId = item.sessionId.replace(`${item.channel}-`, "");
      await dispatchToOutbox(item.channel, chatId, item.proposedReply);
      updatedItem = shadowDB.updateStatus(id, "approved", auditNote) || item;
    } else if (action === "reject") {
      updatedItem = shadowDB.updateStatus(id, "rejected", "رد شده توسط مدیر (False Positive)") || item;
    } else if (action === "modify") {
      if (!editedReply) {
        return res.status(400).json({ error: "editedReply is required for modify action." });
      }
      const chatId = item.sessionId.replace(`${item.channel}-`, "");
      await dispatchToOutbox(item.channel, chatId, editedReply);
      updatedItem = shadowDB.updateStatus(id, "modified", "ویرایش دستی توسط مدیر و ارسال به مقصد", editedReply) || item;
    } else {
      return res.status(400).json({ error: "Invalid action. Must be approve, reject, or modify." });
    }

    res.json({ success: true, item: updatedItem });
  } catch (err: any) {
    console.error("Error in /api/pipeline/shadow/action:", err);
    res.status(500).json({ error: err.message || "Failed to execute shadow action." });
  }
});
