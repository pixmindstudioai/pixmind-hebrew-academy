-- Make the access-grant columns the SUMIT (and Meshulam) flows write reproducible from migrations.
-- These already exist in production (the Meshulam webhook writes them), so this is a safe no-op there,
-- but it guarantees a fresh database matches what the edge functions depend on.
alter table public.user_module_access
  add column if not exists provider text,
  add column if not exists transaction_id text;

alter table public.user_bundle_access
  add column if not exists transaction_id text,
  add column if not exists notes text;
