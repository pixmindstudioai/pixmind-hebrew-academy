-- Apple In-App Purchase: link each paid module/bundle to its App Store product id.
-- The iOS app sells via Apple IAP (per-course non-consumable products); the edge function
-- apple-iap-verify maps a purchased productId back to the module/bundle by this column.
alter table public.modules add column if not exists apple_product_id text;
alter table public.bundles add column if not exists apple_product_id text;

-- Fast lookup productId -> item during verification.
create index if not exists modules_apple_product_id_idx on public.modules (apple_product_id);
create index if not exists bundles_apple_product_id_idx on public.bundles (apple_product_id);
