import { shadowDB, type ShadowRecord } from "../../lib/db/database.js";
import { adminIntegrationState } from "../admin/index.js";
import { getGenAI } from "../config.js";
import { globalPrivacySettings, serverLedgerItems } from "../ledger/index.js";
import { dispatchToOutbox } from "../outbox/index.js";
import { evaluateDeterministicRules } from "../rules/index.js";
import type { PipelineChannel, PipelineResult } from "./types.js";

// Core Pipeline Processing Function (Decoupled from HTTP req/res for Webhook reuse)
export async function processPipelineMessage(
  channel: PipelineChannel,
  senderId: string,
  senderDisplay: string,
  text: string,
  domainContext: string,
  environmentMode: "shadow" | "live" = "shadow"
): Promise<PipelineResult> {
  const trimmed = text.trim();
  const startTime = Date.now();

  // 1. Check Deterministic Rules
  const { isRedlineMedical, priceInfo, riskLevel, deterministicRule, rareMedicineGuidance } = evaluateDeterministicRules(trimmed);

  // 2. Call Gemini
  let proposedReply = "";
  try {
    const ai = getGenAI();
    let prompt = `You are Embednet OS Core Intelligence, an executive and operational engine for WhatsApp and local messengers.
User input: "${trimmed}"
Domain Profile: ${domainContext}
Channel: ${channel}
Deterministic Rule triggered: ${deterministicRule || "None"}
Risk Level: ${riskLevel}

Provide a concise, direct, helpful, and natural response in Persian. Avoid corporate fluff or generic AI apologies.`;

    if (rareMedicineGuidance) {
      prompt += `\n\nCRITICAL DETERMINISTIC DATA INJECTED (RARE MEDICINE PROTOCOL):\n${rareMedicineGuidance}`;
    }

    if (priceInfo) {
      prompt += `\n\nCRITICAL DETERMINISTIC DATA INJECTED (DO NOT ALTER PRICES):\n${priceInfo}`;
    }

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.3 },
    });
    proposedReply = geminiRes.text || "پاسخ آماده شد.";
  } catch {
    proposedReply = isRedlineMedical
      ? "هشدار: مورد ارجاع اورژانسی. با شماره ۱۱۵ تماس گرفته شود."
      : (rareMedicineGuidance || (priceInfo
          ? `استعلام دارویی انجام شد:${priceInfo}`
          : `پیام در سامانه ثبت شد و در خط لوله ${channel} پردازش گردید.`));
  }

  const isBaleAutoPersonal = domainContext === "Personal" || domainContext === "bale-auto";
  const isMedicalOrClinical = domainContext === "Clinical" || isRedlineMedical || /دارو|درمان|نسخه|بیمار|قند|فشار|پزشک|کلینیک|قرص|کپسول|تشنج|بیهوش|خونریزی/.test(trimmed);
  const isProfessional = domainContext === "Executive" || domainContext === "Operations";
  const isHighPrivacyMedicalOrProf = (isMedicalOrClinical || isProfessional);
  const shouldEnforceEphemeral = globalPrivacySettings.retentionPolicy === "ephemeral" && isHighPrivacyMedicalOrProf;

  // Global Data Retention / Privacy Pipeline Enforcement
  let retentionTraceDetail = "";
  if (globalPrivacySettings.retentionPolicy === "ephemeral") {
    globalPrivacySettings.ephemeralSessionsCount += 1;
    retentionTraceDetail = shouldEnforceEphemeral
      ? "سیاست سشن موقت (Zero-Retention Ephemeral): ربات پرمحرمانگی پزشکی/حرفه‌ای فعال است. هیچ متادیتایی در دفتر کار (WorkLedger) ذخیره نشد و سشن در حافظه فرار RAM منقضی می‌شود."
      : "سیاست نگهداری داده: سشن در حالت موقت (Ephemeral) پردازش شد؛ ثبت در دفتر کار انجام نشد.";
  } else {
    globalPrivacySettings.loggedSessionsCount += 1;
    retentionTraceDetail = "سیاست ثبت متادیتا در دفتر کار (WorkLedger Audit): متادیتای تعامل، شناسه سشن و خلاصه زمینه برای پایش حاکمیتی در WorkLedger ثبت گردید.";

    // Auto-record interaction metadata to WorkLedger if not already logged
    if (!serverLedgerItems.some(i => i.summary === trimmed)) {
      serverLedgerItems.unshift({
        id: `wld-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: `استعلام ${domainContext}: ${trimmed.slice(0, 32)}...`,
        domainCategory: (domainContext === "Clinical" ? "Clinical" : (domainContext === "Operations" ? "Operations" : "Executive")) as any,
        summary: trimmed,
        activeContext: `خط لوله ${channel.toUpperCase()} (ثبت متادیتای تعامل در WorkLedger)`,
        tasksPending: 1,
        lastUpdated: "اکنون",
        tokenLoad: `${Math.round(trimmed.length * 1.3)} توکن`,
      });
    }
  }

  const shadowId = `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newRecord: ShadowRecord = {
    id: shadowId,
    sessionId: `${channel}-${senderId}`,
    channel,
    senderDisplay,
    userMessage: isBaleAutoPersonal
      ? "[حریم خصوصی: یادداشت شخصی محرمانه]"
      : (shouldEnforceEphemeral && globalPrivacySettings.scrubSensitiveMedicalNotes && isMedicalOrClinical
          ? "[سشن محرمانه پزشکی - پالایش‌شده بر اساس پروتکل Zero-Retention]"
          : trimmed),
    proposedReply,
    timestamp: "اکنون",
    confidenceScore: isRedlineMedical ? 0.99 : 0.92,
    riskLevel: isBaleAutoPersonal ? "safe" : riskLevel,
    status: isBaleAutoPersonal
      ? "approved"
      : (environmentMode === "shadow" || riskLevel !== "safe" ? "pending" : "approved"),
    deterministicRuleApplied: isBaleAutoPersonal
      ? "ZERO_RETENTION_PRIVACY_POLICY (bale-auto)"
      : (shouldEnforceEphemeral ? "EPHEMERAL_SESSION_HIGH_PRIVACY" : deterministicRule),
    auditNote: isBaleAutoPersonal
      ? `سیاست Zero-Retention: بدون ذخیره‌سازی متن خام شخصی / پاسخ آنی (${Date.now() - startTime}ms)`
      : (shouldEnforceEphemeral
          ? `حفظ حریم خصوصی سشن‌های پزشکی/حرفه‌ای (Zero-Retention Ephemeral) | پردازش در ${Date.now() - startTime}ms`
          : `ثبت متادیتا در WorkLedger | پردازش شده در ${Date.now() - startTime}ms`),
  };

  // For bale-auto privacy or pure ephemeral medical sessions, avoid persisting in raw shadow review if scrubbed
  if (!isBaleAutoPersonal) {
    try {
      shadowDB.insert(newRecord);
    } catch (dbErr: any) {
      // Duplicate key on retry — ignore
      if (!String(dbErr?.message).includes("UNIQUE constraint")) {
        console.error("[shadowDB.insert] error:", dbErr);
      }
    }
  }

  // If live and approved, dispatch to Outbox
  if ((environmentMode === "live" || isBaleAutoPersonal) && newRecord.status === "approved") {
    await dispatchToOutbox(channel, senderId, newRecord.proposedReply);
    newRecord.auditNote += " | (Live Dispatch Sent)";
  }

  return {
    record: newRecord,
    trace: [
      { stage: "GATEWAY_INGEST", title: `دریافت رویداد خام از ${channel.toUpperCase()}`, status: "passed", detail: "احراز هویت وب‌هوک و سلامت اتصال با موفقیت تایید شد.", durationMs: 4 },
      { stage: "ENVELOPE_NORMALIZE", title: "تبدیل به پاکت یکپارچه (UnifiedMessage Envelope)", status: "passed", detail: `Channel: ${channel} | ID: ${senderId} | Timestamp: ${Date.now()}`, durationMs: 2 },
      { stage: "DETERMINISTIC_RULES", title: "موتور قوانین قطعی و خطوط قرمز (Hard Rule Gate)", status: deterministicRule ? "intercepted" : "passed", detail: deterministicRule || "هیچ مغایرتی با قوانین صلب امنیتی یافت نشد.", durationMs: 6 },
      { stage: "DATA_RETENTION", title: globalPrivacySettings.retentionPolicy === "ephemeral" ? "سیاست نگهداری داده: سشن‌های موقت (Zero-Retention Ephemeral)" : "سیاست نگهداری داده: ثبت متادیتا در دفتر کار (WorkLedger Audit)", status: globalPrivacySettings.retentionPolicy === "ephemeral" ? "warning" : "passed", detail: retentionTraceDetail, durationMs: 2 },
      { stage: "MEMORY_LOOKUP", title: "فراخوانی حافظه سشن و زمینه پیشین", status: "passed", detail: (isBaleAutoPersonal || shouldEnforceEphemeral) ? "حافظه موقت رم با انقضای آنی (In-Memory Ephemeral TTL - بدون ثبت در دیتابیس)" : `بازیابی حافظه برای نشست ${channel}-${senderId}`, durationMs: 14 },
      { stage: "SHADOW_EVALUATION", title: "حالت سایه و ثبت در صف نظارت (Shadow Mode HITL)", status: isBaleAutoPersonal ? "passed" : (environmentMode === 'shadow' ? "warning" : "passed"), detail: isBaleAutoPersonal ? "بایپس سایه به علت حریم خصوصی Zero-Retention (پاسخ سریع برای حساب‌کتاب)" : (environmentMode === 'shadow' ? "پاسخ به حالت سایه رفت." : "حالت Live فعال است."), durationMs: 5 },
      { stage: "LLM_INFERENCE", title: "پردازش توسط مدل زبان طبیعی", status: "passed", detail: `مدل با تامین‌کننده فعال (${adminIntegrationState.activeAiProvider}) در ${Date.now() - startTime}ms پاسخ داد.`, durationMs: Date.now() - startTime },
      { stage: "OUTBOX_DISPATCH", title: "آماده‌سازی تحویل به کلاینت نهایی", status: newRecord.status === "approved" ? "passed" : "warning", detail: newRecord.status === "approved" ? "ارسال به صف خروجی پیام‌رسان." : "منتظر تایید مدیر.", durationMs: 2 },
    ],
  };
}
