export interface DrugCatalogItem {
  price: number;
  code: string;
  requiresPrescription: boolean;
}

// Deterministic Pricing Database (Mock TTAC/Catalog)
export const DRUG_CATALOG: Record<string, DrugCatalogItem> = {
  "کوآموکسی کلاو": { price: 58200, code: "IRC-10293", requiresPrescription: true },
  "استامینوفن": { price: 12000, code: "IRC-99212", requiresPrescription: false },
  "ایبوپروفن": { price: 15500, code: "IRC-88321", requiresPrescription: false },
};
