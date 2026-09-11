import { DRUG_CATALOG } from "./catalog.js";

export interface DeterministicRuleEvaluation {
  isRedlineMedical: boolean;
  isPricingQuery: boolean;
  priceInfo: string;
  riskLevel: "safe" | "medium_risk" | "high_redline";
  deterministicRule?: string;
}

export function evaluateDeterministicRules(text: string): DeterministicRuleEvaluation {
  const trimmed = text.trim();
  const isRedlineMedical = /تشنج|بیهوش|خونریزی شدید|کما|کاهش هوشیاری|خودکشی/.test(trimmed);

  let priceInfo = "";
  let isPricingQuery = false;
  for (const [drug, info] of Object.entries(DRUG_CATALOG)) {
    if (trimmed.includes(drug)) {
      isPricingQuery = true;
      priceInfo += `\nقیمت مصوب ${drug}: ${info.price.toLocaleString()} تومان (کد TTAC: ${info.code})`;
    }
  }

  if (!isPricingQuery) {
    isPricingQuery = /قیمت|دارو|قانون|ارز|بیمه|فاکتور|ttac|تعرفه/.test(trimmed);
  }

  let riskLevel: "safe" | "medium_risk" | "high_redline" = "safe";
  let deterministicRule: string | undefined = undefined;

  if (isRedlineMedical) {
    riskLevel = "high_redline";
    deterministicRule = "CLINICAL_REDLINE_GUARD (ADR-0002)";
  } else if (isPricingQuery) {
    riskLevel = "medium_risk";
    deterministicRule = "QANOON_PRICE_DETERMINISTIC_ENGINE (ADR-0001)";
  }

  return {
    isRedlineMedical,
    isPricingQuery,
    priceInfo,
    riskLevel,
    deterministicRule,
  };
}
