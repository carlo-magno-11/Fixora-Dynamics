create policy fixora_rate_limit_buckets_deny_client_access
on fixora_private.fixora_rate_limit_buckets
for all
to anon, authenticated
using (false)
with check (false);
