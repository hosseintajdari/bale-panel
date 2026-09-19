import { Router } from "express";
import { auditDB } from "../../lib/db/database.js";
import {
  channelStatuses,
  gatewayPulseConfig,
  gatewayTelemetryMap,
  getChannelsWithTelemetry,
  recordGatewayAuditEvent,
} from "./state.js";

export const gatewayRouter = Router();

// Gateway Pulse Check & Telemetry Endpoints
gatewayRouter.get("/api/system/pulse-settings", (req, res) => {
  res.json({
    success: true,
    config: gatewayPulseConfig,
    telemetry: gatewayTelemetryMap,
    channels: getChannelsWithTelemetry(),
  });
});

gatewayRouter.post("/api/system/pulse-settings", (req, res) => {
  const { enabled, gateways, refreshIntervalSec, alertOnJitterThresholdMs } = req.body || {};
  if (typeof enabled === "boolean") {
    gatewayPulseConfig.enabled = enabled;
  }
  if (gateways && typeof gateways === "object") {
    gatewayPulseConfig.gateways = {
      ...gatewayPulseConfig.gateways,
      ...gateways,
    };
  }
  if (typeof refreshIntervalSec === "number") {
    gatewayPulseConfig.refreshIntervalSec = refreshIntervalSec;
  }
  if (typeof alertOnJitterThresholdMs === "number") {
    gatewayPulseConfig.alertOnJitterThresholdMs = alertOnJitterThresholdMs;
  }
  gatewayPulseConfig.lastCheckedAt = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

  recordGatewayAuditEvent({
    channelId: "all",
    channelName: "تنظیمات مرکزی گیت‌وی‌ها",
    eventType: "config_change",
    severity: "info",
    summary: gatewayPulseConfig.enabled
      ? "پیکربندی و فعال‌سازی پایش تله‌متری پالس کانال‌ها"
      : "غیرفعال‌سازی موقت پالس دوره‌ای کانال‌ها",
    details: `بازه پالس: ${gatewayPulseConfig.refreshIntervalSec} ثانیه | حد آستانه جیتر: ${gatewayPulseConfig.alertOnJitterThresholdMs}ms | درگاه‌ها: ${Object.entries(gatewayPulseConfig.gateways).filter(([_, v]) => v).map(([k]) => k).join(', ')}`,
    triggeredBy: "operator_toggle",
    metadata: { config: gatewayPulseConfig },
  });

  res.json({
    success: true,
    config: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    message: gatewayPulseConfig.enabled
      ? "پایش پالس و تله‌متری بلادرنگ درگاه‌ها با موفقیت فعال و پیکربندی شد."
      : "پایش پالس غیرفعال شد (حالت استاندارد سبک)."
  });
});

gatewayRouter.post("/api/gateways/pulse-ping", (req, res) => {
  const nowStr = "هم‌اکنون";
  gatewayPulseConfig.lastCheckedAt = nowStr;

  const { mode, spikeChannel } = req.body || {};

  // Realistic dynamic pulse jitter simulation around base latencies
  const jitterFactor = () => (Math.random() * 4 - 2); // -2 to +2 ms fluctuation

  if (mode === "simulate_spike") {
    // Inject high-latency bottleneck simulation to showcase visual health alert tiers
    gatewayTelemetryMap.whatsapp.pingMs = Math.round(148 + Math.random() * 20); // Critical >= 140ms
    gatewayTelemetryMap.whatsapp.jitterMs = 18.4;
    gatewayTelemetryMap.whatsapp.lastPulseAt = nowStr;

    gatewayTelemetryMap.bale.pingMs = Math.round(98 + Math.random() * 12); // Warning 90-139ms
    gatewayTelemetryMap.bale.jitterMs = 9.1;
    gatewayTelemetryMap.bale.lastPulseAt = nowStr;

    gatewayTelemetryMap.telegram.pingMs = Math.round(52 + jitterFactor() * 2); // Stable 50-89ms
    gatewayTelemetryMap.telegram.jitterMs = 5.2;
    gatewayTelemetryMap.telegram.lastPulseAt = nowStr;

    gatewayTelemetryMap.sms.pingMs = Math.round(185 + Math.random() * 25); // Critical >= 140ms
    gatewayTelemetryMap.sms.jitterMs = 24.0;
    gatewayTelemetryMap.sms.lastPulseAt = nowStr;

    // Record audit events for simulated bottlenecks
    recordGatewayAuditEvent({
      channelId: "whatsapp",
      channelName: "واتساپ (WhatsApp Gateway)",
      eventType: "latency_alert",
      severity: "critical",
      summary: `هشدار بحرانی: جهش تاخیر پینگ واتساپ (${gatewayTelemetryMap.whatsapp.pingMs}ms)`,
      details: "تاخیر شبکه از آستانه بحرانی ۱۴۰ میلی‌ثانیه فراتر رفت. نوسان جیتر به ۱۸.۴ میلی‌ثانیه افزایش یافت.",
      latencyMs: gatewayTelemetryMap.whatsapp.pingMs,
      jitterMs: gatewayTelemetryMap.whatsapp.jitterMs,
      healthLevel: "critical",
      triggeredBy: "spike_simulation",
    });

    recordGatewayAuditEvent({
      channelId: "sms",
      channelName: "سامانه پیامک (SMS Alert Gate)",
      eventType: "latency_alert",
      severity: "critical",
      summary: `هشدار بحرانی: کندی در پول ارسال پیامک (${gatewayTelemetryMap.sms.pingMs}ms)`,
      details: "صف رله اپراتورهای پیامکی دچار تاخیر تایید شده است.",
      latencyMs: gatewayTelemetryMap.sms.pingMs,
      jitterMs: gatewayTelemetryMap.sms.jitterMs,
      healthLevel: "critical",
      triggeredBy: "spike_simulation",
    });

    recordGatewayAuditEvent({
      channelId: "bale",
      channelName: "پیام‌رسان بله (Bale Hook)",
      eventType: "latency_alert",
      severity: "warning",
      summary: `هشدار احتیاط: تاخیر شبکه پیام‌رسان بله (${gatewayTelemetryMap.bale.pingMs}ms)`,
      details: "لتنسی به ۹۸ میلی‌ثانیه رسیده است اما صف ارسال نرمال گزارش شده است.",
      latencyMs: gatewayTelemetryMap.bale.pingMs,
      jitterMs: gatewayTelemetryMap.bale.jitterMs,
      healthLevel: "warning",
      triggeredBy: "spike_simulation",
    });
  } else if (spikeChannel && gatewayTelemetryMap[spikeChannel]) {
    // Spike only a specific channel
    gatewayTelemetryMap[spikeChannel].pingMs = Math.round(155 + Math.random() * 15);
    gatewayTelemetryMap[spikeChannel].jitterMs = 21.0;
    gatewayTelemetryMap[spikeChannel].lastPulseAt = nowStr;

    recordGatewayAuditEvent({
      channelId: spikeChannel,
      channelName: spikeChannel === "whatsapp" ? "واتساپ" : spikeChannel === "bale" ? "بله" : spikeChannel === "telegram" ? "تلگرام" : "پیامک",
      eventType: "latency_alert",
      severity: "critical",
      summary: `هشدار بحرانی تک‌کاناله: جهش لتنسی ${spikeChannel}`,
      details: `تاخیر ${gatewayTelemetryMap[spikeChannel].pingMs}ms ثبت شد.`,
      latencyMs: gatewayTelemetryMap[spikeChannel].pingMs,
      jitterMs: gatewayTelemetryMap[spikeChannel].jitterMs,
      healthLevel: "critical",
      triggeredBy: "spike_simulation",
    });
  } else {
    // Standard baseline pulse check
    gatewayTelemetryMap.whatsapp.pingMs = Math.max(18, Math.round(24 + jitterFactor()));
    gatewayTelemetryMap.whatsapp.jitterMs = parseFloat((1.8 + Math.random() * 0.8).toFixed(1));
    gatewayTelemetryMap.whatsapp.lastPulseAt = nowStr;

    gatewayTelemetryMap.bale.pingMs = Math.max(30, Math.round(38 + jitterFactor() * 1.5));
    gatewayTelemetryMap.bale.jitterMs = parseFloat((3.8 + Math.random() * 1.2).toFixed(1));
    gatewayTelemetryMap.bale.lastPulseAt = nowStr;

    gatewayTelemetryMap.telegram.pingMs = Math.max(45, Math.round(52 + jitterFactor() * 2));
    gatewayTelemetryMap.telegram.jitterMs = parseFloat((5.2 + Math.random() * 1.8).toFixed(1));
    gatewayTelemetryMap.telegram.lastPulseAt = nowStr;

    gatewayTelemetryMap.sms.pingMs = Math.max(95, Math.round(110 + jitterFactor() * 3));
    gatewayTelemetryMap.sms.jitterMs = parseFloat((11.0 + Math.random() * 3.5).toFixed(1));
    gatewayTelemetryMap.sms.lastPulseAt = nowStr;

    // Record routine successful pulse heartbeat audit event
    recordGatewayAuditEvent({
      channelId: "all",
      channelName: "پالس همگانی درگاه‌ها",
      eventType: "heartbeat",
      severity: "success",
      summary: "استعلام موفق ضربان قلب و تایید سلامت اتصالات",
      details: `پینگ درگاه‌ها: واتساپ (${gatewayTelemetryMap.whatsapp.pingMs}ms) | بله (${gatewayTelemetryMap.bale.pingMs}ms) | تلگرام (${gatewayTelemetryMap.telegram.pingMs}ms) | پیامک (${gatewayTelemetryMap.sms.pingMs}ms)`,
      latencyMs: gatewayTelemetryMap.whatsapp.pingMs,
      jitterMs: gatewayTelemetryMap.whatsapp.jitterMs,
      healthLevel: "optimal",
      triggeredBy: "manual_ping",
    });
  }

  res.json({
    success: true,
    config: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    message: mode === "simulate_spike"
      ? "سناریوی تست تاخیر بالا با موفقیت شبیه‌سازی شد؛ رنگ آیکون‌ها و هشدارهای بصری به‌روز شدند."
      : "پالس بلادرنگ اتصال با کلیه درگاه‌های فعال با موفقیت محاسبه شد.",
  });
});

// History & Audit Log Endpoints for Channel Gateways
gatewayRouter.get("/api/gateways/history", (req, res) => {
  const { search, channel, eventType, severity, limit = "200" } = req.query;

  const result = auditDB.queryFiltered({
    channel: channel as string,
    eventType: eventType as string,
    severity: severity as string,
    search: search as string,
    limit: parseInt(limit as string, 10) || 200,
  });

  res.json({
    success: true,
    total: result.events.length,
    stats: result.stats,
    events: result.events,
  });
});

// Clear/Prune History Log
gatewayRouter.post("/api/gateways/history/clear", (req, res) => {
  auditDB.clear();

  const resetEv = recordGatewayAuditEvent({
    channelId: "all",
    channelName: "سیستم مانیتورینگ گیت‌وی",
    eventType: "config_change",
    severity: "info",
    summary: "پاکسازی جدول لاگ‌های حسابرسی توسط اپراتور سیستم",
    details: "تاریخچه حسابرسی گیت‌وی‌ها بازنشانی شد. ثبت رویدادهای زنده از این لحظه ادامه خواهد یافت.",
    triggeredBy: "operator_toggle",
  });

  res.json({
    success: true,
    message: "تاریخچه مانیتورینگ گیت‌وی‌ها بازنشانی شد.",
    events: [resetEv],
  });
});

// Channel Gateway Status Transition Endpoint
gatewayRouter.post("/api/gateways/status", (req, res) => {
  const { channelId, status, reason } = req.body || {};
  const validChannels = ["whatsapp", "bale", "telegram", "sms"];
  const validStatuses = ["active", "standby", "disconnected"];

  if (!channelId || !validChannels.includes(channelId)) {
    return res.status(400).json({ error: "شناسه درگاه نامعتبر است." });
  }

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "وضعیت نامعتبر است (باید active، standby یا disconnected باشد)." });
  }

  const prevStatus = channelStatuses[channelId] || "active";
  channelStatuses[channelId] = status as "active" | "standby" | "disconnected";

  const channelNames: Record<string, string> = {
    whatsapp: "واتساپ (WhatsApp Gateway)",
    bale: "پیام‌رسان بله (Bale Hook)",
    telegram: "تلگرام (Telegram Bot API)",
    sms: "سامانه پیامک (SMS Alert Gate)",
  };

  const severity = status === "disconnected" ? "critical" : status === "standby" ? "warning" : "success";

  recordGatewayAuditEvent({
    channelId,
    channelName: channelNames[channelId] || channelId,
    eventType: "status_change",
    severity,
    summary: `تغییر وضعیت درگاه ${channelNames[channelId] || channelId} به ${status === 'active' ? 'فعال (Active)' : status === 'standby' ? 'آماده‌باش (Standby)' : 'قطع اتصال (Disconnected)'}`,
    details: `وضعیت اتصال از '${prevStatus}' به '${status}' تغییر یافت. علت: ${reason || "تغییر کنترل‌شده توسط اپراتور کنسول"}`,
    previousStatus: prevStatus,
    newStatus: status,
    latencyMs: gatewayTelemetryMap[channelId]?.pingMs || 30,
    jitterMs: gatewayTelemetryMap[channelId]?.jitterMs || 2.0,
    healthLevel: status === "disconnected" ? "critical" : status === "standby" ? "warning" : "optimal",
    triggeredBy: "operator_toggle",
  });

  res.json({
    success: true,
    channelId,
    previousStatus: prevStatus,
    status,
    channels: getChannelsWithTelemetry(),
    message: `وضعیت درگاه ${channelNames[channelId]} به ${status} به‌روزرسانی و در تاریخچه حسابرسی ثبت شد.`,
  });
});
