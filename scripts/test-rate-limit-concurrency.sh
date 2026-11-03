#!/usr/bin/env bash
set -euo pipefail

database_url="${1:-}"
if [ -z "$database_url" ]; then
  echo "Usage: bash scripts/test-rate-limit-concurrency.sh <local-database-url>"
  exit 2
fi

case "$database_url" in
  *127.0.0.1:54322*|*localhost:54322*) ;;
  *)
    echo "Refusing to run rate limit concurrency fixtures outside the local Supabase test database."
    exit 2
    ;;
esac

bucket_hash="$(openssl rand -hex 32)"
tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

request_rate_limit() {
  local number="$1"
  psql -qAt "$database_url" -v ON_ERROR_STOP=1 -c "SET ROLE service_role; SELECT allowed FROM public.fixora_server_consume_rate_limit(pg_catalog.decode('$bucket_hash', 'hex'), 3, 60);" >"$tmp_dir/$number"
}

pids=()
for number in $(seq 1 12); do
  request_rate_limit "$number" &
  pids+=("$!")
done

for pid in "${pids[@]}"; do
  wait "$pid"
done

successes="$(grep -hxc 't' "$tmp_dir"/* | awk '{sum += $1} END {print sum + 0}')"
rejections="$(grep -hxc 'f' "$tmp_dir"/* | awk '{sum += $1} END {print sum + 0}')"

if [ "$successes" -ne 3 ] || [ "$rejections" -ne 9 ]; then
  for result in "$tmp_dir"/*; do cat "$result"; done
  echo "Expected 3 allowed and 9 rejected concurrent requests; got $successes allowed and $rejections rejected."
  exit 1
fi

echo "Rate limit concurrency passed: 3 allowed, 9 rejected, no overrun.";
