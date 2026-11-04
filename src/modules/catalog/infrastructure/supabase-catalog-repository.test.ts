import { describe, expect, it } from "vitest";
import { mapCatalogRow } from "./supabase-catalog-repository";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";

type CatalogRow = Database["public"]["Tables"]["fixora_catalog_items"]["Row"];

const row: CatalogRow = {
  id: "item-1",
  business_id: "business-1",
  name: "Jabón artesanal",
  kind: "product",
  unit: "pieza",
  sku: "JAB-01",
  currency_code: "MXN",
  reference_cost: 25.5,
  is_active: true,
  created_by: "user-1",
  created_at: "2026-11-03T12:00:00.000Z",
  updated_at: "2026-11-03T12:00:00.000Z",
};

describe("Supabase catalog repository mapping", () => {
  it("maps a database row into the domain model without exposing tenant metadata", () => {
    expect(mapCatalogRow(row)).toEqual({
      id: "item-1",
      name: "Jabón artesanal",
      kind: "product",
      unit: "pieza",
      sku: "JAB-01",
      currency: "MXN",
      referenceCost: 25.5,
      active: true,
    });
  });

  it("maps numeric database values and inactive records", () => {
    expect(mapCatalogRow({ ...row, reference_cost: 0, is_active: false })).toMatchObject({
      referenceCost: 0,
      active: false,
    });
  });
});
