import { describe, expect, it } from "vitest";
import { mapSnapshotRow } from "./supabase-calculation-history-repository";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";

type SnapshotRow = Database["public"]["Tables"]["fixora_calculation_snapshots"]["Row"];

const row: SnapshotRow = {
  id: "00000000-0000-4000-8000-000000000001",
  business_id: "business-1",
  created_by: "user-1",
  created_at: "2026-11-03T12:00:00.000Z",
  name: "Jabón artesanal",
  currency_code: "MXN",
  schema_version: 1,
  formula_version: "pricing.v1",
  pricing_input: {
    materials: 85,
    laborMinutes: 90,
    hourlyRate: 100,
    directExpenses: 12,
    wasteRate: 0.05,
    fixedExpensesPerUnit: 18,
    variableFeeRate: 0.04,
    targetMarginRate: 0.3,
    discountRate: 0,
  },
  pricing_result: {
    materialCost: 85,
    laborCost: 150,
    wasteCost: 4.25,
    directCost: 12,
    totalUnitCost: 269.25,
    suggestedPrice: 384.64,
    profitAtSuggestedPrice: 115.39,
    effectiveMargin: 0.3,
    markup: 0.4282,
  },
  catalog_item_snapshot: null,
};

describe("Supabase calculation history mapping", () => {
  it("maps a valid immutable calculation snapshot", () => {
    expect(mapSnapshotRow(row)).toMatchObject({
      id: row.id,
      name: "Jabón artesanal",
      createdAt: row.created_at,
      currency: "MXN",
      snapshotVersion: 1,
      formulaVersion: "pricing.v1",
    });
  });

  it("rejects malformed historical payloads without mutating them", () => {
    expect(mapSnapshotRow({ ...row, pricing_input: { materials: "invalid" } })).toBeNull();
    expect(mapSnapshotRow({ ...row, currency_code: "EUR" })).toBeNull();
  });
});
