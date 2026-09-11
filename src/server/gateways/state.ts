import { auditDB, shadowDB } from "../../lib/db/database.js";

export interface ServerGatewayAuditEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  channelId: string;
  channelName: string;
  eventType: "heartbeat" | "status_change" | "latency_alert" | "config_change";
  severity: "info" | "success" | "warning" | "critical";
  summary: string;
  details?: string;
  latencyMs?: number;
  jitterMs?: number;
  healthLevel?: "optimal" | "stable" | "warning" | "critical";
  previousStatus?: string;
  newStatus?: string;
  packetLossPct?: number;
  webhookAckRatePct?: number;
  triggeredBy?: "system_heartbeat" | "manual_ping" | "spike_simulation" | "operator_toggle" | "inbound_webhook";
  metadata?: Record<string, any>;
}

export interface GatewayTelemetry {
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  throughputKbs: number;
  webhookAckRatePct: number;
  keepAliveSec: number;
  protocol: string;
  healthScore: number;
  lastPulseAt: string;
  dnsResolutionMs: number;
  tlsHandshakeMs: number;
}

export const gatewayPulseConfig = {
  enabled: true,
  gateways: {
    whatsapp: true,
    bale: true,
    telegram: true,
    sms: true,
  },
  refreshIntervalSec: 3,
  alertOnJitterThresholdMs: 40,
  lastCheckedAt: "هم‌اکنون",
};

export const gatewayTelemetryMap: Record<string, GatewayTelemetry> = {
  whatsapp: {
    pingMs: 24,
    jitterMs: 2.1,
    packetLossPct: 0.0,
    throughputKbs: 142.5,
    webhookAckRatePct: 99.8,
    keepAliveSec: 15,
    protocol: "WebSocket v2 (Evolution API)",
    healthScore: 99,
    lastPulseAt: "هم‌اکنون",
    dnsResolutionMs: 3.2,
    tlsHandshakeMs: 8.4,
  },
  bale: {
    pingMs: 38,
    jitterMs: 4.3,
    packetLossPct: 0.1,
    throughputKbs: 88.0,
    webhookAckRatePct: 99.4,
    keepAliveSec: 20,
    protocol: "HTTPS Webhook (bale-med API)",
    healthScore: 95,
    lastPulseAt: "هم‌اکنون",
    dnsResolutionMs: 4.8,
    tlsHandshakeMs: 14.1,
  },
  telegram: {
    pingMs: 52,
    jitterMs: 6.0,
    packetLossPct: 0.0,
    throughputKbs: 64.2,
    webhookAckRatePct: 100.0,
    keepAliveSec: 30,
    protocol: "TLS 1.3 Direct Webhook",
    healthScore: 96,
    lastPulseAt: "۱ دقیقه پیش",
    dnsResolutionMs: 5.1,
    tlsHandshakeMs: 19.5,
  },
  sms: {
    pingMs: 110,
    jitterMs: 12.4,
    packetLossPct: 0.0,
    throughputKbs: 12.8,
    webhookAckRatePct: 98.9,
    keepAliveSec: 60,
    protocol: "REST Provider Pool (Faraz/Kavenegar)",
    healthScore: 91,
    lastPulseAt: "هم‌اکنون",
    dnsResolutionMs: 8.2,
    tlsHandshakeMs: 32.0,
  },
};

export const channelStatuses: Record<string, "active" | "standby" | "disconnected"> = {
  whatsapp: "active",
  bale: "active",
  telegram: "standby",
  sms: "active",
};

export function recordGatewayAuditEvent(event: Omit<ServerGatewayAuditEvent, "id" | "timestamp" | "timeFormatted" | "dateFormatted">): ServerGatewayAuditEvent {
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateFormatted = now.toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const auditEvent: ServerGatewayAuditEvent = {
    id,
    timestamp: now.toISOString(),
    timeFormatted,
    dateFormatted,
    ...event,
  };
  try {
    auditDB.insert({
      id,
      timestamp: now.toISOString(),
      timeFormatted,
      dateFormatted,
      channelId: event.channelId,
      channelName: event.channelName,
      eventType: event.eventType,
      severity: event.severity,
      summary: event.summary,
      details: event.details,
      latencyMs: event.latencyMs,
      jitterMs: event.jitterMs,
      healthLevel: event.healthLevel,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      packetLossPct: event.packetLossPct,
      webhookAckRatePct: event.webhookAckRatePct,
      triggeredBy: event.triggeredBy,
      metadata: event.metadata,
    });
  } catch (e) {
    console.error("Failed to insert audit event into DB:", e);
  }
  return auditEvent;
}

export function getChannelsWithTelemetry() {
  return [
    {
      id: "whatsapp",
      displayName: "WhatsApp Multi-Device Gateway",
      status: channelStatuses.whatsapp || "active",
      method: "Evolution API v2 / Direct Webhook",
      latencyMs: gatewayTelemetryMap.whatsapp.pingMs,
      unprocessedQueue: shadowDB.countByChannelAndStatus("whatsapp", "pending"),
      lastHeartbeat: gatewayTelemetryMap.whatsapp.lastPulseAt,
      telemetry: gatewayTelemetryMap.whatsapp,
    },
    {
      id: "bale",
      displayName: "Bale Messenger Bot Hook",
      status: channelStatuses.bale || "active",
      method: "Bale Webhook Pipeline (bale-med)",
      latencyMs: gatewayTelemetryMap.bale.pingMs,
      unprocessedQueue: shadowDB.countByChannelAndStatus("bale", "pending"),
      lastHeartbeat: gatewayTelemetryMap.bale.lastPulseAt,
      telemetry: gatewayTelemetryMap.bale,
    },
    {
      id: "telegram",
      displayName: "Telegram Bot API",
      status: channelStatuses.telegram || "standby",
      method: "Direct HTTPS Webhook",
      latencyMs: gatewayTelemetryMap.telegram.pingMs,
      unprocessedQueue: 0,
      lastHeartbeat: gatewayTelemetryMap.telegram.lastPulseAt,
      telemetry: gatewayTelemetryMap.telegram,
    },
    {
      id: "sms",
      displayName: "Iran SMS Fast-Alert Gateway",
      status: channelStatuses.sms || "active",
      method: "REST Provider Gate (Kavenegar/Faraz)",
      latencyMs: gatewayTelemetryMap.sms.pingMs,
      unprocessedQueue: 0,
      lastHeartbeat: gatewayTelemetryMap.sms.lastPulseAt,
      telemetry: gatewayTelemetryMap.sms,
    },
  ];
}
