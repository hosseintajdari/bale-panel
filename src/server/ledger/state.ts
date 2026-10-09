/** Canonical domain categories shared across ledger routes (#78). */
export const DOMAIN_CATEGORIES = ["Executive", "Clinical", "Operations", "Personal", "Pharmacy"] as const;
export type DomainCategory = (typeof DOMAIN_CATEGORIES)[number];

export interface LedgerItem {
  id: string;
  title: string;
  domainCategory: DomainCategory;
  summary: string;
  activeContext: string;
  tasksPending: number;
  lastUpdated: string;
  tokenLoad: string;
}

export interface PrivacySettings {
  retentionPolicy: "audited" | "ephemeral";
  highPrivacyBotTypes: string[];
  scrubSensitiveMedicalNotes: boolean;
  ephemeralSessionsCount: number;
  loggedSessionsCount: number;
  lastToggledAt: string;
}

// In-Memory Shared Ledger Items
export const serverLedgerItems: LedgerItem[] = [
  {
    id: "wld-101",
    title: "بررسی معماری میان‌افزار Embednet OS و لانگ‌بات",
    domainCategory: "Executive",
    summary: "جداسازی لایه وب‌هوک واتساپ (Evolution API v2) از هسته محاسباتی و تعیین گیت‌های تایید Shadow Mode.",
    activeContext: "جلسه بازبینی سیستم / ارزیابی جایگزینی OpenClaw با لانگ‌بات",
    tasksPending: 2,
    lastUpdated: "امروز، ۱۰:۴۵",
    tokenLoad: "1,420 توکن",
  },
  {
    id: "wld-102",
    title: "توسعه موتور قوانین قطعی قیمت دارو (Qanoon-Price)",
    domainCategory: "Clinical",
    summary: "استخراج ضرایب ارزش افزوده و سقف قیمت‌های مصوب سازمان غذا و دارو بدون اتکا به توهمات مدل زبانی.",
    activeContext: "سرویس کاتالوگ و استعلام کد IRC",
    tasksPending: 1,
    lastUpdated: "امروز، ۰۹:۱۵",
    tokenLoad: "3,890 توکن",
  },
  {
    id: "wld-103",
    title: "هماهنگی ابزارهای جانبی و دسترسی ربات bale-auto",
    domainCategory: "Operations",
    summary: "صدور توکن‌های دسترسی کنترل‌شده برای اسکریپت‌های اتوماتیک بله جهت پایش لاگ‌ها.",
    activeContext: "تفویض اختیارات و دسترسی‌های گزینشی",
    tasksPending: 0,
    lastUpdated: "دیروز، ۱۸:۲۰",
    tokenLoad: "850 توکن",
  },
  {
    id: "wld-104",
    title: "ارتقای فرآیند بازبینی سایه (HITL Pharmacist Review)",
    domainCategory: "Clinical",
    summary: "تثبیت ADR-0001 و ADR-0002 جهت پیشگیری از ارسال پاسخ‌های پرریسک به بیماران بدون تایید ناظر.",
    activeContext: "بایگانی و استخراج شواهد تریاژ",
    tasksPending: 3,
    lastUpdated: "دیروز، ۱۵:۰۰",
    tokenLoad: "2,100 توکن",
  },
];

// Global Data Privacy & Retention Policy State
export const globalPrivacySettings: PrivacySettings = {
  retentionPolicy: "audited",
  highPrivacyBotTypes: ["medical", "clinical", "professional", "triage"],
  scrubSensitiveMedicalNotes: true,
  ephemeralSessionsCount: 48,
  loggedSessionsCount: 192,
  lastToggledAt: "اکنون",
};
