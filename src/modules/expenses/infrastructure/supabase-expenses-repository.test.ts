import { describe, expect, it } from "vitest";
import { mapExpenseRows, mapExpenseSettings } from "./supabase-expenses-repository";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";

type ExpenseRow = Database["public"]["Tables"]["fixora_expenses"]["Row"];
type ExpenseSettings = Database["public"]["Tables"]["fixora_expense_settings"]["Row"];

const baseRow: ExpenseRow = {
  id: "expense-1",
  business_id: "business-1",
  expense_type: "fixed",
  name: "Renta",
  amount: 1200.5,
  is_active: true,
  created_by: "user-1",
  created_at: "2026-11-03T12:00:00.000Z",
  updated_at: "2026-11-03T12:00:00.000Z",
};

const settings: ExpenseSettings = {
  business_id: "business-1",
  expected_units: 100,
  period: "month",
  version: 3,
  updated_by: "user-1",
  created_at: "2026-11-03T12:00:00.000Z",
  updated_at: "2026-11-03T12:00:00.000Z",
};

describe("Supabase expenses repository mapping", () => {
  it("separates fixed and variable rows and normalizes numeric values", () => {
    expect(mapExpenseRows([
      baseRow,
      { ...baseRow, id: "expense-2", expense_type: "variable", name: "Empaque", amount: 2.25 },
    ])).toEqual({
      fixed: [{ id: "expense-1", name: "Renta", amount: 1200.5 }],
      variable: [{ id: "expense-2", name: "Empaque", costPerUnit: 2.25 }],
    });
  });

  it("maps valid settings to a stable application state", () => {
    expect(mapExpenseSettings(settings)).toEqual({
      expectedUnits: 100,
      period: "month",
      version: 3,
    });
  });

  it("rejects unknown periods and unsafe settings", () => {
    expect(() => mapExpenseSettings({ ...settings, period: "fortnight" })).toThrow("periodo de gastos no reconocido");
    expect(() => mapExpenseSettings({ ...settings, expected_units: 0 })).toThrow("configuración de gastos");
    expect(() => mapExpenseSettings({ ...settings, version: -1 })).toThrow("configuración de gastos");
  });
});
