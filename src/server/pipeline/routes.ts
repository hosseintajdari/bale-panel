import { Router } from "express";
import type { Request, Response } from "express";
import { EventEmitter } from "events";
import { shadowDB, type ShadowRecord } from "../../lib/db/database.js";
import { gatewayPulseConfig, getChannelsWithTelemetry } from "../gateways/index.js";
import { globalPrivacySettings } from "../ledger/index.js";
import { dispatchToOutbox } from "../outbox/index.js";
import { requireOperatorAuth } from "../auth/index.js";
import { processPipelineMessage } from "./engine.js";

export const pipelineRouter = Router();

// ---------------------------------------------------------------------------
// SSE Event Bus — in-process pub/sub for real-time shadow queue updates
// ---------------------------------------------------------------------------
export const shadowEventBus = new EventEmitter();
shadowEventBus.setMaxListeners(100); // support up to 100 concurrent panel tabs

// ---------------------------------------------------------------------------
// GET /api/pipeline/state — snapshot for initial page load
// ---------------------------------------------------------------------------
pipelineRouter.get("/api/pipeline/state", (req: Request, res: Response) => {
  const queue = shadowDB.getAll();
  const allRecords = shadowDB.getAll();
  const totalProcessed = allRecords.filter((r) => r.status !== "pending").length;
  const autoApprovedSafe = allRecords.filter((r) => r.status === "approved").length;
  const rejectedOrRedline = allRecords.filter((r) => r.status === "rejected").length;

  res.json({
    status: "operational",
    environment: "Embednet OS Core v4.2 (LangBot Modular Pattern + SQLite Persistence)",
    privacySettings: globalPrivacySettings,
    pulseConfig: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    shadowQueue: queue,
    stats: {
      totalProcessed,
      shadowIntercepted: queue.length,
      autoApprovedSafe,
      rejectedOrRedline,
      ephemeralSessions: globalPrivacySettings.ephemeralSessionsCount,
      auditedSessions: globalPrivacySettings.loggedSessionsCount,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/pipeline/stream — SSE real-time feed (Refs #8 Phase 6a)
// ---------------------------------------------------------------------------
pipelineRouter.get("/api/pipeline/stream", requireOperatorAuth, (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nginx: disable buffering
  res.flushHeaders();

  // Send initial ping so client knows connection is live
  res.write(`event: ping\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);

  // Forward shadow-update events from bus to this SSE client
  const onShadowUpdate = (payload: object) => {
    res.write(`event: shadow-update\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  shadowEventBus.on("shadow-update", onShadowUpdate);

  // Heartbeat every 30 s to prevent proxy/load-balancer timeouts
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
  }, 30_000);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    shadowEventBus.off("shadow-update", onShadowUpdate);
  });
});

// ---------------------------------------------------------------------------
// GET /api/health — lightweight liveness probe (no auth required)
// ---------------------------------------------------------------------------
pipelineRouter.get("/api/health", (req: Request, res: Response) => {
  try {
    const queue = shadowDB.getAll();
    res.json({
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      db: "connected",
      queueSize: queue.length,
    });
  } catch {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/pipeline/ingest/shadow-trace — ingest from backend engines
// Refs #8 Phase 6a — auth added, SSE broadcast on new record
// ---------------------------------------------------------------------------
pipelineRouter.post("/api/pipeline/ingest/shadow-trace", requireOperatorAuth, (req: Request, res: Response) => {
  try {
    const { engine_id, shadow_item } = req.body || {};
    if (!engine_id || typeof engine_id !== "string" || !shadow_item || typeof shadow_item !== "object") {
      return res.status(400).json({ error: "Missing or invalid required fields: engine_id and shadow_item" });
    }
    if (!shadow_item.userMessage || !shadow_item.proposedReply) {
      return res.status(400).json({ error: "shadow_item must include userMessage and proposedReply" });
    }

    const record: ShadowRecord = {
      id: shadow_item.id || `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: shadow_item.sessionId || engine_id,
      channel: shadow_item.channel || "bale",
      senderDisplay: shadow_item.senderDisplay || engine_id,
      userMessage: shadow_item.userMessage,
      proposedReply: shadow_item.proposedReply,
      timestamp: shadow_item.timestamp || new Date().toISOString(),
      confidenceScore: shadow_item.confidenceScore ?? 0.9,
      riskLevel: shadow_item.riskLevel || "safe",
      status: "pending", // always pending on ingest
      deterministicRuleApplied: shadow_item.deterministicRuleApplied ?? null,
      auditNote: shadow_item.auditNote ?? null,
      editedReply: shadow_item.editedReply ?? null,
    };

    shadowDB.insert(record);

    // Broadcast to all connected SSE clients
    shadowEventBus.emit("shadow-update", { type: "new", record });

    res.json({ success: true, message: "Shadow record ingested.", id: record.id });
  } catch (err: any) {
    console.error("Error ingesting shadow trace:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/pipeline/process — internal pipeline trigger (test / operator use)
// ---------------------------------------------------------------------------
pipelineRouter.post("/api/pipeline/process", async (req: Request, res: Response) => {
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

    // Broadcast the newly created record to SSE clients
    shadowEventBus.emit("shadow-update", { type: "new", record: result.record });

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

// ---------------------------------------------------------------------------
// POST /api/pipeline/shadow/action — approve / reject / modify
// ---------------------------------------------------------------------------
pipelineRouter.post("/api/pipeline/shadow/action", async (req: Request, res: Response) => {
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

    // Broadcast status change to SSE clients
    shadowEventBus.emit("shadow-update", { type: "action", id, status: updatedItem.status });

    res.json({ success: true, item: updatedItem });
  } catch (err: any) {
    console.error("Error in /api/pipeline/shadow/action:", err);
    res.status(500).json({ error: err.message || "Failed to execute shadow action." });
  }
});
