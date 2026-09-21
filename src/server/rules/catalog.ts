export interface DrugCatalogItem {
  price: number;
  code: string;
  requiresPrescription: boolean;
  unit?: string;
  category?: "pharma" | "rare_special" | "otc";
  designatedPharmacies?: string[];
  inquiryChannel?: string;
}

// Deterministic Pricing Database (Mock TTAC/Catalog)
export const DRUG_CATALOG: Record<string, DrugCatalogItem> = {
  "کوآموکسی کلاو": { price: 58200, code: "IRC-10293", requiresPrescription: true, unit: "قرص" },
  "استامینوفن": { price: 12000, code: "IRC-99212", requiresPrescription: false, unit: "قرص" },
  "ایبوپروفن": { price: 15500, code: "IRC-88321", requiresPrescription: false, unit: "قرص" },
  "هرسپتین": {
    price: 18500000,
    code: "IRC-77412",
    requiresPrescription: true,
    unit: "ویال",
    category: "rare_special",
    designatedPharmacies: ["داروخانه ۱۳ آبان", "داروخانه ۲۹ فروردین", "داروخانه هلال احمر"],
    inquiryChannel: "سامانه ۱۹۰ - اطلاعات دارویی و کمبودهای وزارت بهداشت",
  },
  "IVIG": {
    price: 12500000,
    code: "IRC-66321",
    requiresPrescription: true,
    unit: "ویال",
    category: "rare_special",
    designatedPharmacies: ["داروخانه ۲۹ فروردین", "داروخانه هلال احمر مرکزی"],
    inquiryChannel: "سامانه ۱۹۰ - اطلاعات دارویی و کمبودهای وزارت بهداشت",
  },
  "آزیترومایسین": { price: 34000, code: "IRC-33211", requiresPrescription: true, unit: "کپسول" },
};
