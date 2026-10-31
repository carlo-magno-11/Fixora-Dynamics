create index fixora_catalog_items_created_by_idx
  on public.fixora_catalog_items (created_by);

create index fixora_expenses_created_by_idx
  on public.fixora_expenses (created_by);

create index fixora_expense_settings_updated_by_idx
  on public.fixora_expense_settings (updated_by);

create index fixora_calculation_snapshots_created_by_idx
  on public.fixora_calculation_snapshots (created_by);
