export interface CalculationExportRecord {
  name: string;
  createdAt: string;
  currency: "MXN" | "USD";
  input: {
    materials: number;
    laborMinutes: number;
    hourlyRate: number;
    directExpenses: number;
    wasteRate: number;
    fixedExpensesPerUnit: number;
    variableFeeRate: number;
    targetMarginRate: number;
    discountRate: number;
  };
  result: {
    materialCost: number;
    laborCost: number;
    wasteCost: number;
    directCost: number;
    totalUnitCost: number;
    suggestedPrice: number;
    profitAtSuggestedPrice: number;
    effectiveMargin: number;
    markup: number;
  };
  formulaVersion?: string;
}

const HEADERS = [
  "Fecha (UTC)",
  "Nombre",
  "Moneda",
  "Materiales (entrada)",
  "Tiempo de trabajo (min)",
  "Coste por hora",
  "Otros costes directos",
  "Tasa de merma",
  "Materiales calculados",
  "Mano de obra calculada",
  "Merma calculada",
  "Costes directos calculados",
  "Gastos fijos por unidad",
  "Coste total unitario",
  "Comisión",
  "Descuento",
  "Margen objetivo",
  "Precio sugerido",
  "Ganancia estimada",
  "Margen efectivo",
  "Recargo",
  "Versión de fórmula",
] as const;

function safeCell(value: string | number): string {
  let text = String(value);
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function calculationsToCsv(records: readonly CalculationExportRecord[]): string {
  const rows = records.map((record) => [
    record.createdAt,
    record.name,
    record.currency,
    record.input.materials,
    record.input.laborMinutes,
    record.input.hourlyRate,
    record.input.directExpenses,
    record.input.wasteRate,
    record.result.materialCost,
    record.result.laborCost,
    record.result.wasteCost,
    record.result.directCost,
    record.input.fixedExpensesPerUnit,
    record.result.totalUnitCost,
    record.input.variableFeeRate,
    record.input.discountRate,
    record.input.targetMarginRate,
    record.result.suggestedPrice,
    record.result.profitAtSuggestedPrice,
    record.result.effectiveMargin,
    record.result.markup,
    record.formulaVersion ?? "pricing.v1",
  ]);

  return [HEADERS, ...rows]
    .map((row) => row.map(safeCell).join(","))
    .join("\r\n");
}
