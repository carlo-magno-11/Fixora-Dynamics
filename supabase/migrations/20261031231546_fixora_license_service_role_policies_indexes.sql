create policy "fixora_products_service_role"
on fixora_private.fixora_products
for all to service_role
using (true) with check (true);

create policy "fixora_purchase_orders_service_role"
on fixora_private.fixora_purchase_orders
for all to service_role
using (true) with check (true);

create policy "fixora_licenses_service_role"
on fixora_private.fixora_licenses
for all to service_role
using (true) with check (true);

create policy "fixora_license_entitlements_service_role"
on fixora_private.fixora_license_entitlements
for all to service_role
using (true) with check (true);

create policy "fixora_license_devices_service_role"
on fixora_private.fixora_license_devices
for all to service_role
using (true) with check (true);

create policy "fixora_activation_codes_service_role"
on fixora_private.fixora_activation_code_hashes
for all to service_role
using (true) with check (true);

create policy "fixora_provider_events_service_role"
on fixora_private.fixora_provider_events
for all to service_role
using (true) with check (true);

create policy "fixora_license_events_service_select"
on fixora_private.fixora_license_events
for select to service_role
using (true);

create policy "fixora_license_events_service_insert"
on fixora_private.fixora_license_events
for insert to service_role
with check (true);

create index fixora_purchase_orders_product_sku_idx
  on fixora_private.fixora_purchase_orders (product_sku);

create index fixora_purchase_orders_verified_by_idx
  on fixora_private.fixora_purchase_orders (verified_by);

create index fixora_licenses_product_sku_idx
  on fixora_private.fixora_licenses (product_sku);

create index fixora_activation_codes_redeemed_by_idx
  on fixora_private.fixora_activation_code_hashes (redeemed_by);

create index fixora_license_events_actor_user_idx
  on fixora_private.fixora_license_events (actor_user_id);
