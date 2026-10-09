import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const configuredDbPath = process.env.EMBEDNET_DB_PATH?.trim();
const DB_PATH = configuredDbPath
  ? path.resolve(process.cwd(), configuredDbPath)
  : path.join(process.cwd(), "data", "embednet.db");
const DATA_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/** Canonical risk-level enum shared across layers (#86). */
export const RISK_LEVELS = ["safe", "medium_risk", "high_redline"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

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
    risk_level TEXT DEFAULT 'safe' CHECK (risk_level IN ('safe', 'medium_risk', 'high_redline')),
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

  CREATE TABLE IF NOT EXISTS bot_sessions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    timestamp TEXT NOT NULL,
    sender_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_bot_sessions_lookup ON bot_sessions(tenant_id, session_id, created_at ASC);

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    token_hash TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'auditor')),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_used_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(token_hash);

  CREATE TABLE IF NOT EXISTS telegram_keyboards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schema_json TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS telegram_webapps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    config_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// Migration (#86): normalize risk_level values written before ingest validation
// existed. Idempotent; invalid values fall back to the 'safe' default.
const normalized = db
  .prepare(
    `UPDATE shadow_queue SET risk_level = 'safe'
     WHERE risk_level NOT IN ('safe', 'medium_risk', 'high_redline')`
  )
  .run();
if (normalized.changes > 0) {
  console.log(`[DB] Normalized ${normalized.changes} shadow_queue row(s) with invalid risk_level to 'safe'.`);
}

export interface ShadowRecord {
  id: string;
  sessionId: string;
  channel: "whatsapp" | "bale" | "telegram" | "sms";
  senderDisplay: string;
  userMessage: string;
  proposedReply: string;
  timestamp: string;
  confidenceScore: number;
  riskLevel: RiskLevel;
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
    timestamp_iso, confidence_score, risk_level, status, deterministic_rule, audit_note, edited_reply)
  VALUES (@id, @sessionId, @channel, @senderDisplay, @userMessage, @proposedReply,
    @timestamp, @confidenceScore, @riskLevel, @status, @deterministicRuleApplied, @auditNote, @editedReply)
`);

const stmtGetAllShadow = db.prepare(`SELECT * FROM shadow_queue ORDER BY created_at DESC LIMIT 200`);
const stmtGetShadowById = db.prepare(`SELECT * FROM shadow_queue WHERE id = ?`);
const stmtUpdateShadowStatus = db.prepare(`
  UPDATE shadow_queue SET status = @status, audit_note = @auditNote, edited_reply = @editedReply WHERE id = @id
`);
const stmtCountByChannelStatus = db.prepare(`
  SELECT COUNT(*) as count FROM shadow_queue WHERE channel = ? AND status = ?
`);
const stmtCountByStatus = db.prepare(`
  SELECT status, COUNT(*) as count FROM shadow_queue GROUP BY status
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
      editedReply: record.editedReply ?? null,
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
  /** Full-table status aggregates — avoids the 200-row display window (#76). */
  countByStatus(): Record<string, number> {
    const rows = stmtCountByStatus.all() as any[];
    const out: Record<string, number> = {};
    for (const r of rows) out[String(r.status)] = Number(r.count) || 0;
    return out;
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

/** Parse stored metadata JSON defensively; corrupt blobs fall back to undefined (#85). */
function parseMetadataJson(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

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
    metadata: parseMetadataJson(row.metadata_json),
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
  queryFiltered(params: {
    channel?: string;
    eventType?: string;
    severity?: string;
    search?: string;
    limit?: number;
  }): { events: AuditLogRecord[]; stats: { totalEvents: number; heartbeats: number; statusChanges: number; latencyAlerts: number; configChanges: number } } {
    // Build the filter clause once; it applies to both the event list and the
    // summary stats so the stats reflect the active filters (#87).
    let where = "WHERE 1=1";
    const args: any[] = [];

    if (params.channel && params.channel !== "all") {
      where += " AND (channel_id = ? OR channel_id = 'all')";
      args.push(params.channel);
    }
    if (params.eventType && params.eventType !== "all") {
      where += " AND event_type = ?";
      args.push(params.eventType);
    }
    if (params.severity && params.severity !== "all") {
      where += " AND severity = ?";
      args.push(params.severity);
    }
    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      where += " AND (summary LIKE ? OR details LIKE ? OR channel_name LIKE ? OR channel_id LIKE ? OR id LIKE ? OR previous_status LIKE ? OR new_status LIKE ?)";
      args.push(q, q, q, q, q, q, q);
    }

    const rows = db
      .prepare(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ?`)
      .all(...args, params.limit || 200) as any[];
    const events = rows.map(rowToAuditRecord);

    const statsRow = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN event_type = 'heartbeat' THEN 1 ELSE 0 END) as heartbeats,
        SUM(CASE WHEN event_type = 'status_change' THEN 1 ELSE 0 END) as statusChanges,
        SUM(CASE WHEN event_type = 'latency_alert' THEN 1 ELSE 0 END) as latencyAlerts,
        SUM(CASE WHEN event_type = 'config_change' THEN 1 ELSE 0 END) as configChanges
      FROM audit_logs ${where}
    `).get(...args) as any;

    const stats = {
      totalEvents: statsRow?.total || 0,
      heartbeats: statsRow?.heartbeats || 0,
      statusChanges: statsRow?.statusChanges || 0,
      latencyAlerts: statsRow?.latencyAlerts || 0,
      configChanges: statsRow?.configChanges || 0,
    };

    return { events, stats };
  },
  clear(): void {
    db.prepare("DELETE FROM audit_logs").run();
  },
  count(): number {
    return (db.prepare("SELECT COUNT(*) as c FROM audit_logs").get() as any).c;
  },
  seedIfEmpty(): void {
    const count = (db.prepare("SELECT COUNT(*) as c FROM audit_logs").get() as any).c;
    if (count === 0) {
      const now = Date.now();
      const initialLogs: AuditLogRecord[] = [
        {
          id: "aud-109",
          timestamp: new Date(now - 45 * 1000).toISOString(),
          timeFormatted: new Date(now - 45 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
          channelId: "whatsapp",
          channelName: "واتساپ (WhatsApp Gateway)",
          eventType: "heartbeat",
          severity: "success",
          summary: "پالس سلامت دوره‌ای و استعلام لتنسی موفق",
          details: "پینگ 24ms با نوسان جیتر 1.8ms • سوکت Evolution API v2 کاملاً پایدار و آنلاین است.",
          latencyMs: 24,
          jitterMs: 1.8,
          healthLevel: "optimal",
          packetLossPct: 0.0,
          webhookAckRatePct: 99.8,
          triggeredBy: "system_heartbeat",
          metadata: { endpoint: "https://wa-relay.embednet.internal/pulse", protocol: "TLS 1.3" },
        },
        {
          id: "aud-108",
          timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
          timeFormatted: new Date(now - 3 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
          channelId: "bale",
          channelName: "پیام‌رسان بله (Bale Hook)",
          eventType: "heartbeat",
          severity: "info",
          summary: "ارزیابی اتصال خط رله داخلی ایران (bale-med)",
          details: "لتنسی ۳۸ میلی‌ثانیه‌ای ثبت شد. تطابق بدون وقفه با پروتکل شبیه‌ساز پایپ‌لاین پزشکی.",
          latencyMs: 38,
          jitterMs: 3.8,
          healthLevel: "optimal",
          packetLossPct: 0.0,
          webhookAckRatePct: 99.4,
          triggeredBy: "system_heartbeat",
        },
        {
          id: "aud-107",
          timestamp: new Date(now - 9 * 60 * 1000).toISOString(),
          timeFormatted: new Date(now - 9 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
          channelId: "telegram",
          channelName: "تلگرام (Telegram Bot API)",
          eventType: "status_change",
          severity: "warning",
          summary: "تغییر وضعیت گیت‌وی به حالت آماده‌باش (Standby)",
          details: "درگاه تلگرام به عنوان پشتیبان اضطراری تعیین شد و وضعیت آن از Active به Standby منتقل گشت.",
          previousStatus: "active",
          newStatus: "standby",
          latencyMs: 52,
          jitterMs: 5.2,
          healthLevel: "stable",
          triggeredBy: "operator_toggle",
        },
        {
          id: "aud-106",
          timestamp: new Date(now - 17 * 60 * 1000).toISOString(),
          timeFormatted: new Date(now - 17 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
          channelId: "sms",
          channelName: "سامانه پیامک (SMS Alert Gate)",
          eventType: "latency_alert",
          severity: "warning",
          summary: "نوسان تاخیر پول ارسال سریع پیامک",
          details: "لتنسی استعلام به 110ms رسید و در محدوده زرد (هشدار تاخیر) قرار گرفت. کلیه وب‌هوک‌ها تایید شده‌اند.",
          latencyMs: 110,
          jitterMs: 12.4,
          healthLevel: "warning",
          packetLossPct: 0.0,
          webhookAckRatePct: 98.9,
          triggeredBy: "system_heartbeat",
        },
        {
          id: "aud-105",
          timestamp: new Date(now - 32 * 60 * 1000).toISOString(),
          timeFormatted: new Date(now - 32 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
          channelId: "all",
          channelName: "پیکربندی کل گیت‌وی‌ها",
          eventType: "config_change",
          severity: "info",
          summary: "فعال‌سازی سیستم پالس تله‌متری بلادرنگ و پایش جیتر",
          details: "بازه تازه‌سازی خودکار روی ۳۰ ثانیه تنظیم شد و آستانه هشدار نوسان جیتر روی ۱۵ میلی‌ثانیه قفل شد.",
          triggeredBy: "operator_toggle",
          metadata: { refreshIntervalSec: 30, alertOnJitterThresholdMs: 15 },
        },
        {
          id: "aud-104",
          timestamp: new Date(now - 65 * 60 * 1000).toISOString(),
          timeFormatted: new Date(now - 65 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
          channelId: "whatsapp",
          channelName: "واتساپ (WhatsApp Gateway)",
          eventType: "status_change",
          severity: "success",
          summary: "اتصال موفق دستگاه جفت‌شده و آغاز گوش‌به‌زنگ",
          details: "کانکشن لایه سوکت Baileys برقرار شد. پروتکل ضد مسدودی Inbound-First فعال گردید.",
          previousStatus: "disconnected",
          newStatus: "active",
          latencyMs: 22,
          jitterMs: 1.6,
          healthLevel: "optimal",
          triggeredBy: "system_heartbeat",
        },
      ];
      for (const log of initialLogs) {
        this.insert(log);
      }
    }
  },
};

auditDB.seedIfEmpty();

export interface SessionMessage {
  id: string;
  sessionId: string;
  tenantId?: string;
  role: "user" | "model" | "system";
  content: string;
  image?: string;
  timestamp: string;
  senderName?: string;
}

const stmtInsertSessionMessage = db.prepare(`
  INSERT INTO bot_sessions (id, session_id, tenant_id, role, content, image, timestamp, sender_name)
  VALUES (@id, @sessionId, @tenantId, @role, @content, @image, @timestamp, @senderName)
`);

const stmtGetSessionMessages = db.prepare(`
  SELECT * FROM bot_sessions WHERE tenant_id = ? AND session_id = ? ORDER BY created_at ASC
`);

const stmtClearSession = db.prepare(`
  DELETE FROM bot_sessions WHERE tenant_id = ? AND session_id = ?
`);

export const sessionDB = {
  addMessage(msg: SessionMessage): void {
    stmtInsertSessionMessage.run({
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: msg.sessionId,
      tenantId: msg.tenantId || "default",
      role: msg.role,
      content: msg.content,
      image: msg.image || null,
      timestamp: msg.timestamp,
      senderName: msg.senderName || null,
    });
  },
  getMessages(sessionId: string, tenantId = "default"): SessionMessage[] {
    const rows = stmtGetSessionMessages.all(tenantId, sessionId) as any[];
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      tenantId: r.tenant_id,
      role: r.role,
      content: r.content,
      image: r.image ?? undefined,
      timestamp: r.timestamp,
      senderName: r.sender_name ?? undefined,
    }));
  },
  clearSession(sessionId: string, tenantId = "default"): void {
    stmtClearSession.run(tenantId, sessionId);
  },
  listRecentSessions(tenantId = "default"): Array<{
    sessionId: string;
    channel: string;
    title: string;
    lastMessage: string;
    lastActivity: number;
    messageCount: number;
    pinned?: boolean;
  }> {
    const rows = db.prepare(`
      SELECT 
        session_id as sessionId,
        MAX(created_at) as lastActivity,
        COUNT(*) as messageCount,
        (SELECT content FROM bot_sessions s2 WHERE s2.session_id = bot_sessions.session_id ORDER BY created_at DESC LIMIT 1) as lastMessage,
        (SELECT sender_name FROM bot_sessions s3 WHERE s3.session_id = bot_sessions.session_id AND sender_name IS NOT NULL ORDER BY created_at DESC LIMIT 1) as senderName
      FROM bot_sessions
      WHERE tenant_id = ?
      GROUP BY session_id
      ORDER BY lastActivity DESC
      LIMIT 50
    `).all(tenantId) as any[];

    return rows.map((r) => {
      let channel = "general";
      if (r.sessionId.startsWith("tg-") || r.sessionId.includes("telegram")) channel = "telegram";
      else if (r.sessionId.startsWith("bale-") || r.sessionId.includes("bale")) channel = "bale";
      else if (r.sessionId.startsWith("wa-") || r.sessionId.includes("whatsapp")) channel = "whatsapp";

      return {
        sessionId: r.sessionId,
        channel,
        title: r.senderName || r.sessionId,
        lastMessage: r.lastMessage || "",
        lastActivity: r.lastActivity,
        messageCount: r.messageCount,
      };
    });
  },
  seedIfEmpty(): void {
    const count = (db.prepare("SELECT COUNT(*) as c FROM bot_sessions").get() as any).c;
    if (count === 0) {
      const now = Math.floor(Date.now() / 1000);
      const seeds = [
        {
          id: "msg-init-1",
          sessionId: "tg-gateway-migration",
          role: "user" as const,
          content: "بررسی و تحلیل راهکارهای مهاجرت وب‌هوک به تلگرام و بله",
          senderName: "Gateway migration prompts...",
          timestamp: "3d ago",
        },
        {
          id: "msg-init-2",
          sessionId: "bale-med-pipeline",
          role: "user" as const,
          content: "پایش پایداری اتصال خط رله داخلی ایران (bale-med)",
          senderName: "عیب‌یابی عملکرد ایجنت پایپ‌لاین",
          timestamp: "2d ago",
        },
        {
          id: "msg-init-3",
          sessionId: "tg-cognitive-protocol",
          role: "user" as const,
          content: "پروتکل معماری شناختی و همگام‌سازی یادداشت‌ها در نوشن",
          senderName: "Cognitive And Architectural Protocol",
          timestamp: "1d ago",
        },
        {
          id: "msg-init-4",
          sessionId: "wa-patient-triage",
          role: "user" as const,
          content: "ارزیابی پاسخ‌های هوشمند درگاه واتساپ و قوانین ضد مسدودی",
          senderName: "بهینه‌سازی رابط کاربری و عملکرد ایجنت",
          timestamp: "5h ago",
        },
      ];

      for (const s of seeds) {
        this.addMessage(s);
      }
    }
  }
};

sessionDB.seedIfEmpty();

export type UserRole = "admin" | "operator" | "auditor";

export interface ApiKeyRecord {
  id: string;
  tokenHash: string;
  name: string;
  role: UserRole;
  tenantId: string;
  createdAt: number;
  lastUsedAt?: number;
}

const stmtInsertApiKey = db.prepare(`
  INSERT INTO api_keys (id, token_hash, name, role, tenant_id, created_at, last_used_at)
  VALUES (@id, @tokenHash, @name, @role, @tenantId, @createdAt, @lastUsedAt)
`);

const stmtGetApiKeyByHash = db.prepare(`
  SELECT * FROM api_keys WHERE token_hash = ?
`);

const stmtListApiKeys = db.prepare(`
  SELECT id, name, role, tenant_id, created_at, last_used_at FROM api_keys ORDER BY created_at DESC
`);

const stmtDeleteApiKey = db.prepare(`
  DELETE FROM api_keys WHERE id = ?
`);

const stmtTouchApiKey = db.prepare(`
  UPDATE api_keys SET last_used_at = unixepoch() WHERE token_hash = ?
`);

export const apiKeyDB = {
  createKey(record: { id: string; tokenHash: string; name: string; role: UserRole; tenantId?: string }): void {
    stmtInsertApiKey.run({
      id: record.id,
      tokenHash: record.tokenHash,
      name: record.name,
      role: record.role,
      tenantId: record.tenantId || "default",
      createdAt: Math.floor(Date.now() / 1000),
      lastUsedAt: null,
    });
  },
  validateKey(tokenHash: string): { valid: boolean; role?: UserRole; tenantId?: string; name?: string } {
    const row = stmtGetApiKeyByHash.get(tokenHash) as any;
    if (!row) return { valid: false };
    stmtTouchApiKey.run(tokenHash);
    return { valid: true, role: row.role as UserRole, tenantId: row.tenant_id, name: row.name };
  },
  listKeys(): Omit<ApiKeyRecord, "tokenHash">[] {
    const rows = stmtListApiKeys.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      tenantId: r.tenant_id,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at ?? undefined,
    }));
  },
  deleteKey(id: string): boolean {
    const res = stmtDeleteApiKey.run(id);
    return res.changes > 0;
  },
};

export interface TelegramKeyboardRecord {
  id: string;
  name: string;
  schemaJson: string;
  createdAt: number;
  updatedAt: number;
}

const stmtInsertTgKeyboard = db.prepare(`
  INSERT INTO telegram_keyboards (id, name, schema_json, created_at, updated_at)
  VALUES (@id, @name, @schemaJson, @createdAt, @updatedAt)
`);

const stmtUpdateTgKeyboard = db.prepare(`
  UPDATE telegram_keyboards SET name = @name, schema_json = @schemaJson, updated_at = @updatedAt WHERE id = @id
`);

const stmtListTgKeyboards = db.prepare(`SELECT * FROM telegram_keyboards ORDER BY updated_at DESC`);
const stmtGetTgKeyboard = db.prepare(`SELECT * FROM telegram_keyboards WHERE id = ?`);
const stmtDeleteTgKeyboard = db.prepare(`DELETE FROM telegram_keyboards WHERE id = ?`);

export const telegramKeyboardDB = {
  save(record: { id?: string; name: string; schemaJson: string }): TelegramKeyboardRecord {
    const now = Math.floor(Date.now() / 1000);
    if (record.id) {
      const existing = stmtGetTgKeyboard.get(record.id) as any;
      if (existing) {
        stmtUpdateTgKeyboard.run({ id: record.id, name: record.name, schemaJson: record.schemaJson, updatedAt: now });
        return this.get(record.id)!;
      }
    }
    const id = record.id || `tgkb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    stmtInsertTgKeyboard.run({ id, name: record.name, schemaJson: record.schemaJson, createdAt: now, updatedAt: now });
    return this.get(id)!;
  },
  list(): TelegramKeyboardRecord[] {
    const rows = stmtListTgKeyboards.all() as any[];
    return rows.map(r => ({ id: r.id, name: r.name, schemaJson: r.schema_json, createdAt: r.created_at, updatedAt: r.updated_at }));
  },
  get(id: string): TelegramKeyboardRecord | null {
    const row = stmtGetTgKeyboard.get(id) as any;
    if (!row) return null;
    return { id: row.id, name: row.name, schemaJson: row.schema_json, createdAt: row.created_at, updatedAt: row.updated_at };
  },
  delete(id: string): boolean {
    return stmtDeleteTgKeyboard.run(id).changes > 0;
  }
};

export interface TelegramWebAppRecord {
  id: string;
  name: string;
  url: string;
  configJson?: string;
  createdAt: number;
}

const stmtInsertTgWebApp = db.prepare(`
  INSERT INTO telegram_webapps (id, name, url, config_json, created_at)
  VALUES (@id, @name, @url, @configJson, @createdAt)
`);

const stmtUpdateTgWebApp = db.prepare(`
  UPDATE telegram_webapps SET name = @name, url = @url, config_json = @configJson WHERE id = @id
`);

const stmtListTgWebApps = db.prepare(`SELECT * FROM telegram_webapps ORDER BY created_at DESC`);
const stmtGetTgWebApp = db.prepare(`SELECT * FROM telegram_webapps WHERE id = ?`);
const stmtDeleteTgWebApp = db.prepare(`DELETE FROM telegram_webapps WHERE id = ?`);

export const telegramWebAppDB = {
  save(record: { id?: string; name: string; url: string; configJson?: string }): TelegramWebAppRecord {
    const now = Math.floor(Date.now() / 1000);
    if (record.id) {
      const existing = stmtGetTgWebApp.get(record.id) as any;
      if (existing) {
        stmtUpdateTgWebApp.run({ id: record.id, name: record.name, url: record.url, configJson: record.configJson || null });
        return this.get(record.id)!;
      }
    }
    const id = record.id || `tgwa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    stmtInsertTgWebApp.run({ id, name: record.name, url: record.url, configJson: record.configJson || null, createdAt: now });
    return this.get(id)!;
  },
  list(): TelegramWebAppRecord[] {
    const rows = stmtListTgWebApps.all() as any[];
    return rows.map(r => ({ id: r.id, name: r.name, url: r.url, configJson: r.config_json ?? undefined, createdAt: r.created_at }));
  },
  get(id: string): TelegramWebAppRecord | null {
    const row = stmtGetTgWebApp.get(id) as any;
    if (!row) return null;
    return { id: row.id, name: row.name, url: row.url, configJson: row.config_json ?? undefined, createdAt: row.created_at };
  },
  delete(id: string): boolean {
    return stmtDeleteTgWebApp.run(id).changes > 0;
  }
};

export default db;

