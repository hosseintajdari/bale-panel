import { DRUG_CATALOG } from "./catalog.js";

export interface DeterministicRuleEvaluation {
  isRedlineMedical: boolean;
  isPricingQuery: boolean;
  isRareMedicineQuery?: boolean;
  priceInfo: string;
  riskLevel: "safe" | "medium_risk" | "high_redline";
  deterministicRule?: string;
  rareMedicineGuidance?: string;
}

export function evaluateDeterministicRules(text: string): DeterministicRuleEvaluation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const isRedlineMedical = /تشنج|بیهوش|خونریزی شدید|کما|کاهش هوشیاری|خودکشی/.test(trimmed);

  let priceInfo = "";
  let isPricingQuery = false;
  let isRareMedicineQuery = false;
  let rareMedicineGuidance: string | undefined = undefined;

  const isRareKeyword = /داروی خاص|داروی کمیاب|سهمیه ای|کمبود دارویی/.test(trimmed) || trimmed.startsWith("/rare");

  for (const [drug, info] of Object.entries(DRUG_CATALOG)) {
    const matchesDrug = trimmed.includes(drug) || (drug.toUpperCase() === "IVIG" && lower.includes("ivig"));
    if (matchesDrug) {
      if (info.category === "rare_special") {
        isRareMedicineQuery = true;
        rareMedicineGuidance = `راهنمای استعلام داروی کمیاب (${drug}): جهت دریافت سهمیه‌ای با مدارک پزشکی به داروخانه‌های منتخب (${info.designatedPharmacies?.join("، ")}) مراجعه نمایید. استعلام موجودی لحظه‌ای: ${info.inquiryChannel}`;
        priceInfo += `\nقیمت مصوب ${drug}: ${info.price.toLocaleString()} تومان (کد TTAC: ${info.code})`;
      } else {
        isPricingQuery = true;
        priceInfo += `\nقیمت مصوب ${drug}: ${info.price.toLocaleString()} تومان (کد TTAC: ${info.code})`;
      }
    }
  }

  if (isRareKeyword && !isRareMedicineQuery) {
    isRareMedicineQuery = true;
    rareMedicineGuidance = "راهنمای جستجوی داروی کمیاب: جهت استعلام موجودی سهمیه‌ای و داروخانه‌های توزیع، نام دارو را ارسال کنید. سامانه تلفنی کمبودهای دارویی وزارت بهداشت: سامانه ۱۹۰";
  }

  if (!isPricingQuery && !isRareMedicineQuery) {
    isPricingQuery = /قیمت|دارو|قانون|ارز|بیمه|فاکتور|ttac|تعرفه/.test(trimmed);
  }

  let riskLevel: "safe" | "medium_risk" | "high_redline" = "safe";
  let deterministicRule: string | undefined = undefined;

  if (isRedlineMedical) {
    riskLevel = "high_redline";
    deterministicRule = "CLINICAL_REDLINE_GUARD (ADR-0002)";
  } else if (isRareMedicineQuery) {
    riskLevel = "medium_risk";
    deterministicRule = "RARE_MEDICINE_INQUIRY_GUARD (ADR-0002)";
  } else if (isPricingQuery) {
    riskLevel = "medium_risk";
    deterministicRule = "QANOON_PRICE_DETERMINISTIC_ENGINE (ADR-0001)";
  }

  return {
    isRedlineMedical,
    isPricingQuery,
    isRareMedicineQuery,
    priceInfo,
    riskLevel,
    deterministicRule,
    rareMedicineGuidance,
  };
}
