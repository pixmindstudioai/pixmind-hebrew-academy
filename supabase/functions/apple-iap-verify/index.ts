// Apple In-App Purchase verification + access grant.
//
// The iOS app (StoreKit 2) completes a purchase and hands the web layer the transaction id +
// environment; the web calls this function (with the user's Supabase JWT). We verify the
// transaction AUTHORITATIVELY by looking it up against Apple's App Store Server API (an
// authenticated TLS call to Apple's official server is the trust anchor — no fragile on-client
// signature to trust), map the product id to a module/bundle, and grant access to the signed-in
// user. Mirrors the grant/idempotency pattern of sumit-charge.
//
// Secrets (set via `supabase secrets set`, NEVER committed):
//   APPLE_IAP_ISSUER_ID   — App Store Connect API issuer id (UUID)
//   APPLE_IAP_KEY_ID      — the API key id (e.g. 2X9R4HXF34)
//   APPLE_IAP_PRIVATE_KEY — the .p8 private key contents (PEM; literal \n allowed)
//   APPLE_IAP_BUNDLE_ID   — defaults to com.pixmind.academy
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const DEFAULT_BUNDLE_ID = 'com.pixmind.academy';
const STOREKIT_HOST = {
  Production: 'https://api.storekit.itunes.apple.com',
  Sandbox: 'https://api.storekit-sandbox.itunes.apple.com',
};

interface Body {
  transactionId?: string;
  environment?: 'Production' | 'Sandbox';
}

// Generate the short-lived ES256 JWT that authenticates us to the App Store Server API.
async function appleApiToken(issuerId: string, keyId: string, p8: string, bundleId: string) {
  const pem = p8.includes('\\n') ? p8.replace(/\\n/g, '\n') : p8;
  const key = await importPKCS8(pem, 'ES256');
  return await new SignJWT({ bid: bundleId })
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setAudience('appstoreconnect-v1')
    .sign(key);
}

// Decode (no verification needed — the data came from Apple's authenticated API) the JWS payload.
function decodeJwsPayload(jws: string): Record<string, unknown> {
  const part = jws.split('.')[1];
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const ISSUER_ID = Deno.env.get('APPLE_IAP_ISSUER_ID');
  const KEY_ID = Deno.env.get('APPLE_IAP_KEY_ID');
  const PRIVATE_KEY = Deno.env.get('APPLE_IAP_PRIVATE_KEY');
  const BUNDLE_ID = Deno.env.get('APPLE_IAP_BUNDLE_ID') || DEFAULT_BUNDLE_ID;

  if (!ISSUER_ID || !KEY_ID || !PRIVATE_KEY) {
    return json({ success: false, error: 'רכישות באפליקציה אינן מוגדרות עדיין.' }, 503);
  }

  // Identify the user from their Supabase JWT (we grant access to THIS email).
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData } = await userClient.auth.getUser();
  const userEmail = userData?.user?.email?.toLowerCase().trim();
  if (!userEmail) return json({ success: false, error: 'נדרשת התחברות.' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { transactionId, environment }: Body = await req.json();
    if (!transactionId) return json({ success: false, error: 'חסר מזהה עסקה.' }, 400);

    // --- Authoritatively fetch the transaction from Apple ---
    const token = await appleApiToken(ISSUER_ID, KEY_ID, PRIVATE_KEY, BUNDLE_ID);
    const order: Array<'Production' | 'Sandbox'> = environment === 'Sandbox'
      ? ['Sandbox', 'Production'] : ['Production', 'Sandbox'];

    let txn: Record<string, unknown> | null = null;
    let usedEnv = '';
    let appleError = false; // distinguishes "Apple unreachable / error" from "transaction not found"
    for (const env of order) {
      let res: Response;
      try {
        res = await fetch(`${STOREKIT_HOST[env]}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        appleError = true;
        continue;
      }
      if (res.status === 200) {
        const body = await res.json().catch(() => null);
        if (body?.signedTransactionInfo) {
          txn = decodeJwsPayload(body.signedTransactionInfo);
          usedEnv = env;
          break;
        }
        appleError = true; // 200 but unexpected shape
      } else if (res.status !== 404) {
        // 401 / 429 / 5xx → NOT "not found"; never fall through and grant a wrong result.
        appleError = true;
      }
      // a genuine 404 → try the other environment
    }

    if (!txn) {
      return appleError
        ? json({ success: false, error: 'שגיאה זמנית באימות מול Apple. נסה שוב בעוד רגע.' }, 503)
        : json({ success: false, error: 'העסקה לא אומתה מול Apple.' }, 402);
    }

    const productId = String(txn.productId ?? '');
    const txnBundle = String(txn.bundleId ?? '');
    const appleTxnId = String(txn.transactionId ?? transactionId);
    const revoked = txn.revocationDate != null;

    if (txnBundle !== BUNDLE_ID) return json({ success: false, error: 'מזהה אפליקציה לא תואם.' }, 400);
    if (revoked) return json({ success: false, error: 'הרכישה בוטלה/הוחזרה.' }, 402);
    if (!productId) return json({ success: false, error: 'מוצר לא ידוע.' }, 400);

    // If the purchase carried an appAccountToken (we set it to the buyer's user id at purchase),
    // it MUST match the redeeming user — blocks a shared/family Apple ID from moving entitlements
    // to an unrelated app account (e.g. via Restore).
    const normalizeId = (s: string) => s.replace(/-/g, '').toLowerCase();
    const appAccountToken = txn.appAccountToken ? normalizeId(String(txn.appAccountToken)) : null;
    const userId = userData?.user?.id ? normalizeId(userData.user.id) : null;
    if (appAccountToken && userId && appAccountToken !== userId) {
      return json({ success: false, error: 'הרכישה משויכת לחשבון אחר.' }, 409);
    }

    // --- Map the Apple product id → our module/bundle ---
    let itemType: 'module' | 'bundle' | null = null;
    let item: { id: string; title: string } | null = null;
    const { data: mod } = await admin.from('modules').select('id, title').eq('apple_product_id', productId).maybeSingle();
    if (mod) {
      itemType = 'module';
      item = mod as { id: string; title: string };
    } else {
      const { data: bun } = await admin.from('bundles').select('id, title').eq('apple_product_id', productId).maybeSingle();
      if (bun) {
        itemType = 'bundle';
        item = bun as { id: string; title: string };
      }
    }
    if (!itemType || !item) return json({ success: false, error: 'המוצר אינו משויך לקורס. פנה לתמיכה.' }, 404);
    const itemId = item.id;

    // --- Grant helpers (idempotent upserts, retried) — reused pattern from sumit-charge ---
    const grantModule = (moduleId: string) =>
      admin.from('user_module_access').upsert(
        {
          user_email: userEmail, module_id: moduleId, expires_at: null,
          provider: 'apple', transaction_id: appleTxnId,
          notes: `Apple IAP ${appleTxnId}`, granted_at: new Date().toISOString(),
        },
        { onConflict: 'user_email,module_id' },
      );

    const withRetry = async (fn: () => PromiseLike<{ error: unknown }>, attempts = 3) => {
      let lastErr: unknown = null;
      for (let i = 0; i < attempts; i++) {
        const { error } = await fn();
        if (!error) return null;
        lastErr = error;
      }
      return lastErr;
    };

    const grantAccess = async (): Promise<unknown> => {
      if (itemType === 'module') return await withRetry(() => grantModule(itemId));
      let err: unknown = null;
      const { data: existingBundle } = await admin
        .from('user_bundle_access').select('id').eq('user_email', userEmail).eq('bundle_id', itemId).maybeSingle();
      if (!existingBundle) {
        err = await withRetry(() => admin.from('user_bundle_access').insert({
          user_email: userEmail, bundle_id: itemId, expires_at: null,
          transaction_id: appleTxnId, notes: `Apple IAP ${appleTxnId}`, granted_at: new Date().toISOString(),
        }));
      }
      const { data: bundleModules, error: bmError } = await admin
        .from('bundle_modules').select('module_id').eq('bundle_id', itemId);
      if (bmError) return err ?? bmError;
      if (!bundleModules || bundleModules.length === 0) return err ?? new Error('bundle has no linked modules');
      for (const bm of bundleModules) {
        if (bm.module_id) { const e = await withRetry(() => grantModule(bm.module_id)); if (e && !err) err = e; }
      }
      return err;
    };

    // --- Atomically CLAIM the transaction by inserting the purchases row FIRST, BEFORE any grant.
    //     purchases.transaction_id is globally UNIQUE, so concurrent redemptions of the same
    //     transaction serialize at the DB: exactly one insert wins (the owner). A unique-violation
    //     means it was already claimed — we then enforce that the claimer is the same account
    //     (transaction ids are not secret, so this blocks cross-account replay). The grant only
    //     runs once the claim is secured for THIS user. ---
    const baseRow: Record<string, unknown> = {
      user_email: userEmail,
      module_id: itemType === 'module' ? itemId : null,
      amount: null,
      currency: 'USD',
      transaction_id: appleTxnId,
      provider: 'apple',
      payment_date: new Date().toISOString(),
      status: 'completed',
      payment_desc: `${item.title} (Apple IAP, ${usedEnv})`,
    };
    const tryClaim = (withBundle: boolean) =>
      admin.from('purchases')
        .insert(withBundle ? { ...baseRow, bundle_id: itemType === 'bundle' ? itemId : null } : baseRow)
        .select('id').single();

    let purchaseId: string | null = null;
    let claim = await tryClaim(true);
    // A non-unique error may just be the bundle_id column missing — retry without it.
    if (claim.error && (claim.error as { code?: string }).code !== '23505') {
      claim = await tryClaim(false);
    }
    if (claim.error) {
      if ((claim.error as { code?: string }).code === '23505') {
        // Already claimed — must be the same account, else reject cross-account replay.
        const { data: owner } = await admin
          .from('purchases').select('id, user_email').eq('transaction_id', appleTxnId).maybeSingle();
        if (owner?.user_email && owner.user_email !== userEmail) {
          return json({ success: false, error: 'הרכישה כבר שויכה לחשבון אחר.' }, 409);
        }
        purchaseId = owner?.id ?? null; // same user → fall through to idempotent re-grant
      } else {
        // Could not secure the claim → do NOT grant (a grant without a binding would be replayable).
        await admin.from('webhook_logs').insert({
          provider: 'apple', event_type: 'claim_failed',
          payload: { appleTxnId, itemType, itemId, userEmail, productId }, processed: false,
          error_message: claim.error.message,
        });
        return json({ success: false, error: 'שגיאה ברישום הרכישה. נסה שוב.' }, 500);
      }
    } else {
      purchaseId = claim.data?.id ?? null;
    }

    // --- Claim is secured for THIS user → grant access (idempotent) ---
    const grantError = await grantAccess();
    await admin.from('webhook_logs').insert({
      provider: 'apple', event_type: grantError ? 'grant_failed' : 'iap_completed',
      payload: { appleTxnId, productId, itemType, itemId, userEmail, env: usedEnv, purchaseId },
      processed: !grantError, error_message: grantError ? String((grantError as { message?: string })?.message ?? grantError) : null,
    });

    if (grantError) return json({ success: true, purchaseId, transactionId: appleTxnId, grantPending: true });
    return json({ success: true, purchaseId, transactionId: appleTxnId });
  } catch (e) {
    console.error('apple-iap-verify error:', e);
    return json({ success: false, error: 'שגיאת שרת באימות הרכישה.' }, 500);
  }
});
