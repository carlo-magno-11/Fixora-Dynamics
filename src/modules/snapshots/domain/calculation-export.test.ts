import { describe, expect, it } from "vitest";
import { calculationsToCsv } from "./calculation-export";

const record = {
  name: "Kit, edición especial",
  createdAt: "2026-10-30T12:00:00.000Z",
  currency: "MXN" as const,
  input: {
    materials: 100,
    laborMinutes: 60,
    hourlyRate: 50,
    directExpenses: 5,
    wasteRate: 0.1,
    fixedExpensesPerUnit: 20,
    variableFeeRate: 0.05,
    targetMarginRate: 0.25,
    discountRate: 0.1,
  },
  result: {
    materialCost: 100,
    laborCost: 50,
    wasteCost: 10,
    directCost: 165,
    totalUnitCost: 185,
    suggestedPrice: 274.51,
    profitAtSuggestedPrice: 69.49,
    effectiveMargin: 0.25,
    markup: 0.3756,
  },
  formulaVersion: "pricing.v1",
};

describe("calculationsToCsv", () => {
  it("exports a header and calculation values using CRLF rows", () => {
    const csv = calculationsToCsv([record]);
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain("Fecha (UTC),Nombre,Moneda");
    expect(csv).toContain('"Kit, edición especial",MXN');
    expect(csv).toContain("274.51,69.49,0.25,0.3756,pricing.v1");
  });

  it("escapes quotes and line breaks in user-provided names", () => {
    const csv = calculationsToCsv([{ ...record, name: 'Lote "A"\nsegunda línea' }]);
    expect(csv).toContain('"Lote ""A""\nsegunda línea"');
  });

  it.each(["=HYPERLINK(\"https://example.invalid\")", "+SUM(1,1)", "-2+3", "@SUM(A1:A2)", "  =1+1"])(
    "neutralizes spreadsheet formula injection for %s",
    (name) => {
      const csv = calculationsToCsv([{ ...record, name }]);
      if (name.startsWith("=")) {
        expect(csv).toContain("\"'=HYPERLINK(\"\"https://example.invalid\"\")\"");
      } else {
        expect(csv).toContain("'"+name);
      }
    },
  );

  it("returns only the header when there are no records", () => {
    expect(calculationsToCsv([])).toBe("Fecha (UTC),Nombre,Moneda,Materiales (entrada),Tiempo de trabajo (min),Coste por hora,Otros costes directos,Tasa de merma,Materiales calculados,Mano de obra calculada,Merma calculada,Costes directos calculados,Gastos fijos por unidad,Coste total unitario,Comisión,Descuento,Margen objetivo,Precio sugerido,Ganancia estimada,Margen efectivo,Recargo,Versión de fórmula");
  });
});
