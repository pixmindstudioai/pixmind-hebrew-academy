-- Map each paid module to its App Store In-App Purchase product id.
-- These product ids were (re)created in App Store Connect for app 6780379002
-- (com.pixmind.academy). The original *.banana/*.sod/*.onemanai ids were deleted in a
-- prior web-only attempt and are permanently burned by Apple, so we use the *.course.* scheme.
-- The web app reads modules.apple_product_id and passes it to StoreKit via the native bridge;
-- the apple-iap-verify edge function maps a purchased productId back to the module by this column.

update public.modules
  set apple_product_id = 'com.pixmind.academy.course.banana'
  where id = '1aad1d1b-2e47-4b1b-8fec-da1f0ca79ce4';   -- הקלטת סדנת "לסחוט את הבננה" — ₪97

update public.modules
  set apple_product_id = 'com.pixmind.academy.course.sod'
  where id = '26d76c08-01f8-4637-949f-30120c44af1e';   -- שיח סוד — ₪117

update public.modules
  set apple_product_id = 'com.pixmind.academy.course.onemanai'
  where id = '4e5ec6cc-2a9a-45ff-bd06-dd8bb63dd5bb';   -- one man ai studio — ₪700
