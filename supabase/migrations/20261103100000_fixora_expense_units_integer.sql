create or replace function fixora_private.validate_expense_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.expected_units is null
    or new.expected_units <= 0
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
