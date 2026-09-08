import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "embednet.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS shadow_queue (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    sender_display TEXT NOT NULL,
    user_message TEXT NOT NULL,
    proposed_reply TEXT NOT NULL,
    timestamp_iso TEXT NOT NULL,
    confidence_score REAL DEFAULT 0.9,
    risk_level TEXT DEFAULT 'safe',
    status TEXT DEFAULT 'pending',
    deterministic_rule TEXT,
    audit_note TEXT,
    edited_reply TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp_iso TEXT NOT NULL,
    time_formatted TEXT NOT NULL,
    date_formatted TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    latency_ms REAL,
    jitter_ms REAL,
    health_level TEXT,
    previous_status TEXT,
    new_status TEXT,
    packet_loss_pct REAL,
    webhook_ack_rate_pct REAL,
    triggered_by TEXT,
    metadata_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_shadow_status ON shadow_queue(status);
  CREATE INDEX IF NOT EXISTS idx_shadow_channel ON shadow_queue(channel);
  CREATE INDEX IF NOT EXISTS idx_audit_channel ON audit_logs(channel_id);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
`);

export interface ShadowRecord {
  id: string;
  sessionId: string;
  channel: "whatsapp" | "bale" | "telegram" | "sms";
  senderDisplay: string;
  userMessage: string;
  proposedReply: string;
  timestamp: string;
  confidenceScore: number;
  riskLevel: "safe" | "medium_risk" | "high_redline";
  status: "pending" | "approved" | "rejected" | "modified";
  deterministicRuleApplied?: string;
  auditNote?: string;
  editedReply?: string;
}

function rowToShadowRecord(row: any): ShadowRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    channel: row.channel,
    senderDisplay: row.sender_display,
    userMessage: row.user_message,
    proposedReply: row.proposed_reply,
    timestamp: row.timestamp_iso,
    confidenceScore: row.confidence_score,
    riskLevel: row.risk_level,
    status: row.status,
    deterministicRuleApplied: row.deterministic_rule ?? undefined,
    auditNote: row.audit_note ?? undefined,
    editedReply: row.edited_reply ?? undefined,
  };
}

const stmtInsertShadow = db.prepare(`
  INSERT INTO shadow_queue (id, session_id, channel, sender_display, user_message, proposed_reply,
    timestamp_iso, confidence_score, risk_level, status, deterministic_rule, audit_note)
  VALUES (@id, @sessionId, @channel, @senderDisplay, @userMessage, @proposedReply,
    @timestamp, @confidenceScore, @riskLevel, @status, @deterministicRuleApplied, @auditNote)
`);

const stmtGetAllShadow = db.prepare(`SELECT * FROM shadow_queue ORDER BY created_at DESC LIMIT 200`);
const stmtGetShadowById = db.prepare(`SELECT * FROM shadow_queue WHERE id = ?`);
const stmtUpdateShadowStatus = db.prepare(`
  UPDATE shadow_queue SET status = @status, audit_note = @auditNote, edited_reply = @editedReply WHERE id = @id
`);
const stmtCountByChannelStatus = db.prepare(`
  SELECT COUNT(*) as count FROM shadow_queue WHERE channel = ? AND status = ?
`);

export const shadowDB = {
  insert(record: ShadowRecord): void {
    stmtInsertShadow.run({
      id: record.id,
      sessionId: record.sessionId,
      channel: record.channel,
      senderDisplay: record.senderDisplay,
      userMessage: record.userMessage,
      proposedReply: record.proposedReply,
      timestamp: record.timestamp,
      confidenceScore: record.confidenceScore,
      riskLevel: record.riskLevel,
      status: record.status,
      deterministicRuleApplied: record.deterministicRuleApplied ?? null,
      auditNote: record.auditNote ?? null,
    });
  },
  getAll(): ShadowRecord[] {
    return (stmtGetAllShadow.all() as any[]).map(rowToShadowRecord);
  },
  getById(id: string): ShadowRecord | null {
    const row = stmtGetShadowById.get(id) as any;
    return row ? rowToShadowRecord(row) : null;
  },
  updateStatus(id: string, status: ShadowRecord["status"], auditNote: string, editedReply?: string): ShadowRecord | null {
    stmtUpdateShadowStatus.run({ id, status, auditNote, editedReply: editedReply ?? null });
    return this.getById(id);
  },
  countByChannelAndStatus(channel: string, status: string): number {
    const row = stmtCountByChannelStatus.get(channel, status) as any;
    return row?.count ?? 0;
  },
  seedIfEmpty(): void {
    const count = (db.prepare("SELECT COUNT(*) as c FROM shadow_queue").get() as any).c;
    if (count === 0) {
      this.insert({
        id: "sh-901",
        sessionId: "wa-989123456789",
        channel: "whatsapp",
        senderDisplay: "+98 912 345 6789 (سهامدار/همکار)",
        userMessage: "وضعیت گزارش تجمیعی شاخص‌های Embednet OS و خروجی لاگ چت‌ها آماده شد؟",
        proposedReply: "سلام و احترام. بله، شاخص‌های آپ‌تایم و صف اعتبارسنجی سایه (Shadow Queue) در پنل استخراج شده و گزارش برای شما ارسال شد.",
        timestamp: "چند دقیقه پیش",
        confidenceScore: 0.94,
        riskLevel: "safe",
        status: "pending",
        auditNote: "استعلام مدیریتی داخلی - بدون نیاز به رگولاتوری",
      });
    }
  },
};

shadowDB.seedIfEmpty();

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  channelId: string;
  channelName: string;
  eventType: string;
  severity: "info" | "success" | "warning" | "critical";
  summary: string;
  details?: string;
  latencyMs?: number;
  jitterMs?: number;
  healthLevel?: string;
  previousStatus?: string;
  newStatus?: string;
  packetLossPct?: number;
  webhookAckRatePct?: number;
  triggeredBy?: string;
  metadata?: Record<string, any>;
}

const stmtInsertAudit = db.prepare(`
  INSERT INTO audit_logs (id, timestamp_iso, time_formatted, date_formatted, channel_id, channel_name,
    event_type, severity, summary, details, latency_ms, jitter_ms, health_level, previous_status,
    new_status, packet_loss_pct, webhook_ack_rate_pct, triggered_by, metadata_json)
  VALUES (@id, @timestamp, @timeFormatted, @dateFormatted, @channelId, @channelName,
    @eventType, @severity, @summary, @details, @latencyMs, @jitterMs, @healthLevel, @previousStatus,
    @newStatus, @packetLossPct, @webhookAckRatePct, @triggeredBy, @metadataJson)
`);

const stmtGetAuditLogs = db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`);

function rowToAuditRecord(row: any): AuditLogRecord {
  return {
    id: row.id,
    timestamp: row.timestamp_iso,
    timeFormatted: row.time_formatted,
    dateFormatted: row.date_formatted,
    channelId: row.channel_id,
    channelName: row.channel_name,
    eventType: row.event_type,
    severity: row.severity,
    summary: row.summary,
    details: row.details ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    jitterMs: row.jitter_ms ?? undefined,
    healthLevel: row.health_level ?? undefined,
    previousStatus: row.previous_status ?? undefined,
    newStatus: row.new_status ?? undefined,
    packetLossPct: row.packet_loss_pct ?? undefined,
    webhookAckRatePct: row.webhook_ack_rate_pct ?? undefined,
    triggeredBy: row.triggered_by ?? undefined,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
  };
}

export const auditDB = {
  insert(record: AuditLogRecord): void {
    stmtInsertAudit.run({
      id: record.id,
      timestamp: record.timestamp,
      timeFormatted: record.timeFormatted,
      dateFormatted: record.dateFormatted,
      channelId: record.channelId,
      channelName: record.channelName,
      eventType: record.eventType,
      severity: record.severity,
      summary: record.summary,
      details: record.details ?? null,
      latencyMs: record.latencyMs ?? null,
      jitterMs: record.jitterMs ?? null,
      healthLevel: record.healthLevel ?? null,
      previousStatus: record.previousStatus ?? null,
      newStatus: record.newStatus ?? null,
      packetLossPct: record.packetLossPct ?? null,
      webhookAckRatePct: record.webhookAckRatePct ?? null,
      triggeredBy: record.triggeredBy ?? null,
      metadataJson: record.metadata ? JSON.stringify(record.metadata) : null,
    });
  },
  getAll(limit = 200): AuditLogRecord[] {
    return (stmtGetAuditLogs.all(limit) as any[]).map(rowToAuditRecord);
  },
  clear(): void {
    db.prepare("DELETE FROM audit_logs").run();
  },
  count(): number {
    return (db.prepare("SELECT COUNT(*) as c FROM audit_logs").get() as any).c;
  },
};

export default db;
