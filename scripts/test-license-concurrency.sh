#!/usr/bin/env bash
set -euo pipefail

database_url="${1:-}"
if [ -z "$database_url" ]; then
  echo "Usage: bash scripts/test-license-concurrency.sh <local-database-url>"
  exit 2
fi

case "$database_url" in
  *127.0.0.1:54322*|*localhost:54322*) ;;
  *)
    echo "Refusing to run destructive concurrency fixtures outside the local Supabase test database."
    exit 2
    ;;
esac

user_id="cccccccc-cccc-4ccc-8ccc-ccccccccccc3"
external_order_id="FIXORA-CI-CONCURRENCY-001"
output_three="$(mktemp)"
output_four="$(mktemp)"

cleanup() {
  psql "$database_url" -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<SQL || true
BEGIN;
DELETE FROM fixora_private.fixora_license_events
WHERE license_id IN (
  SELECT l.id
  FROM fixora_private.fixora_licenses l
  JOIN fixora_private.fixora_purchase_orders p ON p.id = l.purchase_order_id
  WHERE p.external_order_id = '$external_order_id'
);
DELETE FROM fixora_private.fixora_activation_code_hashes
WHERE license_id IN (
  SELECT l.id
  FROM fixora_private.fixora_licenses l
  JOIN fixora_private.fixora_purchase_orders p ON p.id = l.purchase_order_id
  WHERE p.external_order_id = '$external_order_id'
);
DELETE FROM fixora_private.fixora_license_devices
WHERE license_id IN (
  SELECT l.id
  FROM fixora_private.fixora_licenses l
  JOIN fixora_private.fixora_purchase_orders p ON p.id = l.purchase_order_id
  WHERE p.external_order_id = '$external_order_id'
);
DELETE FROM fixora_private.fixora_license_entitlements
WHERE license_id IN (
  SELECT l.id
  FROM fixora_private.fixora_licenses l
  JOIN fixora_private.fixora_purchase_orders p ON p.id = l.purchase_order_id
  WHERE p.external_order_id = '$external_order_id'
);
DELETE FROM fixora_private.fixora_licenses
WHERE purchase_order_id IN (
  SELECT id FROM fixora_private.fixora_purchase_orders
  WHERE external_order_id = '$external_order_id'
);
DELETE FROM fixora_private.fixora_purchase_orders
WHERE external_order_id = '$external_order_id';
DELETE FROM auth.users WHERE id = '$user_id';
COMMIT;
SQL
  rm -f "$output_three" "$output_four"
}

trap cleanup EXIT
cleanup

psql "$database_url" -v ON_ERROR_STOP=1 >/dev/null <<SQL
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('$user_id', 'fixora-ci-concurrency@example.invalid', '{"display_name":"CI concurrency"}'::jsonb);
SQL

setup_sql="
SET ROLE service_role;
WITH purchase AS (
  INSERT INTO fixora_private.fixora_purchase_orders (
    provider, external_order_id, product_sku, payment_status, refund_status,
    verified_at, verification_method
  )
  VALUES (
    'manual', '$external_order_id', 'FIXORA-ESSENTIALS-ANNUAL',
    'approved', 'none', pg_catalog.now(), 'manual_seller_review'
  )
  RETURNING id
),
issued AS (
  SELECT fixora_private.issue_license_for_verified_purchase(
    purchase.id, '$user_id'
  ) AS license_id
  FROM purchase
),
activation_code AS (
  SELECT issued.license_id,
    fixora_private.create_activation_code(issued.license_id) AS raw_code
  FROM issued
),
activated AS (
  SELECT c.license_id, a.device_id
  FROM activation_code c
  CROSS JOIN LATERAL fixora_private.redeem_activation_code(
    extensions.digest(pg_catalog.convert_to(c.raw_code, 'UTF8'), 'sha256'),
    '$user_id',
    extensions.digest(pg_catalog.convert_to('fixora-ci-device-1', 'UTF8'), 'sha256'),
    'CI device one'
  ) a
),
second_device AS (
  SELECT fixora_private.register_license_device(
    activated.license_id,
    '$user_id',
    extensions.digest(pg_catalog.convert_to('fixora-ci-device-2', 'UTF8'), 'sha256'),
    'CI device two'
  ) AS device_id
  FROM activated
)
SELECT activated.license_id
FROM activated
CROSS JOIN second_device;
";
license_id="$(psql -qAt "$database_url" -v ON_ERROR_STOP=1 -c "$setup_sql")"
if ! [[ "$license_id" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  echo "Could not create concurrency test license."
  exit 1
fi

register_device() {
  local number="$1"
  psql -qAt "$database_url" -v ON_ERROR_STOP=1 -c "SET ROLE service_role; SELECT fixora_private.register_license_device('$license_id', '$user_id', extensions.digest(pg_catalog.convert_to('fixora-ci-device-$number', 'UTF8'), 'sha256'), 'CI device $number');"
}

register_device 3 >"$output_three" 2>&1 &
pid_three=$!
register_device 4 >"$output_four" 2>&1 &
pid_four=$!

set +e
wait "$pid_three"
status_three=$?
wait "$pid_four"
status_four=$?
set -e

successes=0
rejections=0
for status in "$status_three" "$status_four"; do
  if [ "$status" -eq 0 ]; then
    successes=$((successes + 1))
  else
    rejections=$((rejections + 1))
  fi
done

if [ "$successes" -ne 1 ] || [ "$rejections" -ne 1 ]; then
  cat "$output_three"
  cat "$output_four"
  echo "Expected exactly one concurrent device registration to succeed and one to be rejected."
  exit 1
fi

if ! grep -q "Active device limit reached" "$output_three" "$output_four"; then
  cat "$output_three"
  cat "$output_four"
  echo "The rejected registration did not fail for the expected device limit."
  exit 1
fi

active_count="$(psql -qAt "$database_url" -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM fixora_private.fixora_license_devices WHERE license_id = '$license_id' AND status = 'active'")"
if [ "$active_count" != "3" ]; then
  echo "Expected exactly three active devices after the concurrent race; got $active_count."
  exit 1
fi

cleanup
trap - EXIT
echo "Concurrent activation limit passed: one registration accepted, one rejected, three active devices.";
