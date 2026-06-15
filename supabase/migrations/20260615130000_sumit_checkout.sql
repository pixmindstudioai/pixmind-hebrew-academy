-- SUMIT integrated checkout
-- 1) Allow a purchase row to reference a bundle (purchases previously only had module_id).
alter table public.purchases
  add column if not exists bundle_id uuid references public.bundles(id) on delete set null;

-- 2) Idempotency safety net: prevent the same provider transaction from being recorded twice.
--    Wrapped so the migration never fails on pre-existing duplicate/legacy rows — the edge
--    function also dedupes at the application level (select-by-transaction_id before insert).
do $$
begin
  create unique index if not exists purchases_provider_transaction_uniq
    on public.purchases (provider, transaction_id)
    where transaction_id is not null;
exception when others then
  raise notice 'Skipped purchases_provider_transaction_uniq index: %', sqlerrm;
end $$;
