alter table public.fixora_expense_settings
  alter column expected_units type numeric
  using expected_units::numeric;

do $migration$
begin
  if exists (
    select 1
    from public.fixora_expense_settings
    where expected_units::text in ('NaN', 'Infinity', '-Infinity')
      or expected_units <> pg_catalog.trunc(expected_units)
      or expected_units > 9007199254740991
  ) then
    raise exception 'Existing expense settings contain non-integer or unsafe expected units; review them before applying this migration'
      using errcode = '23514';
  end if;
end;
$migration$;

alter table public.fixora_expense_settings
  add constraint fixora_expense_settings_expected_units_safe_integer_check
  check (
    expected_units > 0
    and expected_units::text not in ('NaN', 'Infinity', '-Infinity')
    and expected_units = pg_catalog.trunc(expected_units)
    and expected_units <= 9007199254740991
  ) not valid;

alter table public.fixora_expense_settings
  validate constraint fixora_expense_settings_expected_units_safe_integer_check;

create or replace function fixora_private.validate_expense_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.expected_units is null
    or new.expected_units <= 0
    or new.expected_units::text in ('NaN', 'Infinity', '-Infinity')
    or new.expected_units <> pg_catalog.trunc(new.expected_units)
    or new.expected_units > 9007199254740991
  then
    raise exception 'Expected units must be a positive safe integer'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function fixora_private.validate_expense_settings()
  from public, anon, authenticated;

create trigger fixora_expense_settings_validate_units
before insert or update of expected_units
on public.fixora_expense_settings
for each row
execute function fixora_private.validate_expense_settings();

comment on function fixora_private.validate_expense_settings() is
  'Rejects fractional or unsafe expected unit counts before they can make expense settings unreadable by the application.';
