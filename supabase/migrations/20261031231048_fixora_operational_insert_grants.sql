revoke insert on table public.fixora_catalog_items from authenticated;
grant insert (business_id, name, kind, unit, sku, currency_code, reference_cost)
  on table public.fixora_catalog_items to authenticated;

revoke insert on table public.fixora_expenses from authenticated;
grant insert (business_id, expense_type, name, amount)
  on table public.fixora_expenses to authenticated;

revoke insert on table public.fixora_calculation_snapshots from authenticated;
grant insert (
  business_id, name, currency_code, schema_version,
  formula_version, pricing_input, pricing_result, catalog_item_snapshot
) on table public.fixora_calculation_snapshots to authenticated;
