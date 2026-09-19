import { Router } from "express";
import { globalPrivacySettings, type LedgerItem, serverLedgerItems } from "./state.js";

export const ledgerRouter = Router();

// Endpoints for Work Ledger
ledgerRouter.get("/api/ledger/items", (req, res) => {
  res.json({ success: true, items: serverLedgerItems });
});

ledgerRouter.post("/api/ledger/items", (req, res) => {
  const { title, domainCategory, summary, activeContext } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "عنوان الزامی است." });
  }

  const newItem: LedgerItem = {
    id: `wld-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    domainCategory: domainCategory || "Executive",
    summary: summary || "سشن جدید ثبت‌شده",
    activeContext: activeContext || "ثبت دستی",
    tasksPending: 1,
    lastUpdated: "اکنون",
    tokenLoad: "0 توکن",
  };

  serverLedgerItems.unshift(newItem);
  res.json({ success: true, item: newItem, items: serverLedgerItems });
});

ledgerRouter.patch("/api/ledger/items/:id", (req, res) => {
  const { id } = req.params;
  const item = serverLedgerItems.find((it) => it.id === id);
  if (!item) {
    return res.status(404).json({ error: "آیتم مورد نظر در دفتر کار یافت نشد." });
  }

  const { title, summary, activeContext, tasksPending, domainCategory } = req.body || {};
  if (typeof title === "string" && title.trim()) item.title = title.trim();
  if (typeof summary === "string") item.summary = summary;
  if (typeof activeContext === "string") item.activeContext = activeContext;
  if (typeof tasksPending === "number") item.tasksPending = tasksPending;
  if (domainCategory) item.domainCategory = domainCategory;
  item.lastUpdated = "اکنون";

  res.json({ success: true, item });
});

ledgerRouter.delete("/api/ledger/items/:id", (req, res) => {
  const { id } = req.params;
  const index = serverLedgerItems.findIndex((it) => it.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "آیتم مورد نظر در دفتر کار یافت نشد." });
  }

  const [removed] = serverLedgerItems.splice(index, 1);
  res.json({ success: true, removed, items: serverLedgerItems });
});

// Global Data Privacy & Retention Policy Endpoints
ledgerRouter.get("/api/system/privacy-settings", (req, res) => {
  res.json({
    success: true,
    settings: globalPrivacySettings,
  });
});

ledgerRouter.post("/api/system/privacy-settings", (req, res) => {
  const { retentionPolicy, scrubSensitiveMedicalNotes } = req.body || {};
  if (retentionPolicy === "audited" || retentionPolicy === "ephemeral") {
    globalPrivacySettings.retentionPolicy = retentionPolicy;
    globalPrivacySettings.lastToggledAt = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }
  if (typeof scrubSensitiveMedicalNotes === "boolean") {
    globalPrivacySettings.scrubSensitiveMedicalNotes = scrubSensitiveMedicalNotes;
  }
  res.json({
    success: true,
    settings: globalPrivacySettings,
    message: globalPrivacySettings.retentionPolicy === "ephemeral"
      ? "سیاست سشن‌های موقت (Ephemeral Zero-Retention) برای ربات‌های پزشکی و حرفه‌ای فعال شد. هیچ متادیتایی در دفتر کار ذخیره نخواهد شد."
      : "سیاست ثبت متادیتا در دفتر کار (WorkLedger Audit Logging) فعال شد."
  });
});
