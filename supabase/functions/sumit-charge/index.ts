// SUMIT (OfficeGuy) integrated checkout — server-side charge + access grant.
//
// Flow: the client tokenizes the card with SUMIT's payments.js (public key) and sends us a
// one-time SingleUseToken. This function charges it with the SECRET API key (never exposed to
// the client), then records the purchase and grants module/bundle access to the *authenticated*
// user. Price is always recomputed from the DB — the client never dictates the amount.
//
// Secrets (set via `supabase secrets set`, NEVER committed):
//   SUMIT_COMPANY_ID, SUMIT_API_KEY
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SUMIT_CHARGE_URL = 'https://api.sumit.co.il/billing/payments/charge/';

interface ChargeBody {
  token?: string;            // SUMIT SingleUseToken (og-token)
  itemType?: 'module' | 'bundle';
  itemId?: string;
  fullName?: string;
  phone?: string;
}

const priceOf = (row: { regular_price: number | null; sale_price: number | null; sale_active: boolean | null }) =>
  row.sale_active && row.sale_price != null ? Number(row.sale_price) : Number(row.regular_price ?? 0);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const COMPANY_ID = Deno.env.get('SUMIT_COMPANY_ID');
  const API_KEY = Deno.env.get('SUMIT_API_KEY');

  if (!COMPANY_ID || !API_KEY) {
    return json({ success: false, error: 'תשלום בכרטיס אשראי אינו מוגדר עדיין. נסה שוב מאוחר יותר.' }, 503);
  }

  // Identify the authenticated user from their JWT (we grant access to THIS email, not a client value).
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const userEmail = userData?.user?.email?.toLowerCase().trim();
  if (userErr || !userEmail) {
    return json({ success: false, error: 'נדרשת התחברות לביצוע רכישה.' }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body: ChargeBody = await req.json();
    const { token, itemType, itemId } = body;
    const fullName = (body.fullName || userData!.user!.user_metadata?.full_name || '').toString().trim();

    if (!token || !itemId || (itemType !== 'module' && itemType !== 'bundle')) {
      return json({ success: false, error: 'בקשה לא תקינה.' }, 400);
    }

    // --- Look up the item + compute the amount server-side ---
    const table = itemType === 'module' ? 'modules' : 'bundles';
    const { data: item, error: itemErr } = await admin
      .from(table)
      .select('id, title, is_paid, regular_price, sale_price, sale_active')
      .eq('id', itemId)
      .single();

    if (itemErr || !item) return json({ success: false, error: 'הפריט לא נמצא.' }, 404);
    if (!item.is_paid) return json({ success: false, error: 'פריט זה אינו דורש תשלום.' }, 400);

    const amount = priceOf(item);
    if (!amount || amount <= 0) return json({ success: false, error: 'לא הוגדר מחיר לפריט זה.' }, 400);

    // --- Charge via SUMIT ---
    const chargeReq = {
      Credentials: { CompanyID: Number(COMPANY_ID), APIKey: API_KEY },
      Customer: { Name: fullName || userEmail, EmailAddress: userEmail, Phone: (body.phone ?? '').toString().trim(), SearchMode: 'Automatic' },
      Items: [{ Item: { Name: item.title, SearchMode: 'Automatic' }, Quantity: 1, UnitPrice: amount, Currency: 'ILS' }],
      SingleUseToken: token,
      VATIncluded: true,
      SendDocumentByEmail: true,
    };

    const sumitRes = await fetch(SUMIT_CHARGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chargeReq),
    });
    const result = await sumitRes.json().catch(() => ({}));

    const ok = result?.Status === 0 && result?.Data?.Payment?.ValidPayment === true;
    const transactionId = result?.Data?.Payment?.ID ? String(result.Data.Payment.ID) : null;

    // Audit every attempt (response only — never the card; SUMIT returns just last-4 digits).
    await admin.from('webhook_logs').insert({
      provider: 'sumit',
      event_type: ok ? 'charge_completed' : 'charge_failed',
      payload: { itemType, itemId, amount, userEmail, status: result?.Status, paymentId: transactionId },
      processed: ok,
      error_message: ok ? null : (result?.UserErrorMessage || 'Charge failed'),
    });

    if (!ok || !transactionId) {
      return json({ success: false, error: result?.UserErrorMessage || 'החיוב נכשל. בדוק את פרטי הכרטיס ונסה שוב.' }, 402);
    }

    // --- Access-grant helpers. Grants are idempotent upserts; a charged user MUST end up with
    //     access, so we check every error and retry transient blips. ---
    const grantModule = (moduleId: string) =>
      admin.from('user_module_access').upsert(
        {
          user_email: userEmail,
          module_id: moduleId,
          expires_at: null,
          provider: 'sumit',
          transaction_id: transactionId,
          notes: `SUMIT charge ${transactionId}`,
          granted_at: new Date().toISOString(),
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

    // Grants the purchased item; returns an error (truthy) if access could NOT be fully granted.
    const grantAccess = async (): Promise<unknown> => {
      if (itemType === 'module') {
        return await withRetry(() => grantModule(itemId));
      }
      // Bundle: grant the bundle record + EVERY module in it (module gating reads user_module_access).
      let err: unknown = null;
      const { data: existingBundle } = await admin
        .from('user_bundle_access').select('id').eq('user_email', userEmail).eq('bundle_id', itemId).maybeSingle();
      if (!existingBundle) {
        err = await withRetry(() => admin.from('user_bundle_access').insert({
          user_email: userEmail, bundle_id: itemId, expires_at: null,
          transaction_id: transactionId, notes: `SUMIT charge ${transactionId}`,
          granted_at: new Date().toISOString(),
        }));
      }
      const { data: bundleModules, error: bmError } = await admin
        .from('bundle_modules').select('module_id').eq('bundle_id', itemId);
      if (bmError) return err ?? bmError;
      if (!bundleModules || bundleModules.length === 0) {
        // A paid bundle with no linked modules grants nothing — treat as a grant failure, not success.
        return err ?? new Error('bundle has no linked modules');
      }
      for (const bm of bundleModules) {
        if (bm.module_id) {
          const e = await withRetry(() => grantModule(bm.module_id));
          if (e && !err) err = e;
        }
      }
      return err;
    };

    // --- Idempotency: dedupe on (provider, transaction_id). On a duplicate, RE-APPLY the grant
    //     (idempotent) so a retry repairs any earlier partial grant instead of being short-circuited. ---
    const { data: existing } = await admin
      .from('purchases').select('id').eq('provider', 'sumit').eq('transaction_id', transactionId).maybeSingle();
    if (existing) {
      const repairErr = await grantAccess();
      return json({ success: true, purchaseId: existing.id, transactionId, alreadyProcessed: true, grantPending: !!repairErr });
    }

    // --- Grant access (gating step). ---
    const grantError = await grantAccess();

    // --- Record the purchase (best-effort anchor; tolerate bundle_id column absence). ---
    const baseRow: Record<string, unknown> = {
      user_email: userEmail,
      module_id: itemType === 'module' ? itemId : null,
      amount,
      currency: 'ILS',
      transaction_id: transactionId,
      provider: 'sumit',
      payment_date: new Date().toISOString(),
      status: 'completed',
      payment_desc: item.title,
      full_name: fullName || null,
    };

    let purchaseId: string | null = null;
    let ins = await admin.from('purchases')
      .insert({ ...baseRow, bundle_id: itemType === 'bundle' ? itemId : null })
      .select('id').single();
    if (ins.error) {
      ins = await admin.from('purchases').insert(baseRow).select('id').single();
    }
    if (ins.error) {
      await admin.from('webhook_logs').insert({
        provider: 'sumit', event_type: 'purchase_record_failed',
        payload: { transactionId, itemType, itemId, userEmail, amount },
        processed: false, error_message: ins.error.message,
      });
    } else {
      purchaseId = ins.data?.id ?? null;
    }

    // The card was charged. If access couldn't be fully granted, do NOT tell the user it failed
    // (and never double-charge) — flag it so the client shows "payment received, activating" and
    // ops can reconcile from this critical log. The grant upserts are idempotent so it self-repairs
    // on a retry / manual re-run.
    if (grantError) {
      await admin.from('webhook_logs').insert({
        provider: 'sumit', event_type: 'grant_failed',
        payload: { transactionId, itemType, itemId, userEmail, amount, purchaseId },
        processed: false, error_message: String((grantError as { message?: string })?.message ?? grantError),
      });
      return json({ success: true, purchaseId, transactionId, grantPending: true });
    }

    return json({ success: true, purchaseId, transactionId });
  } catch (e) {
    console.error('sumit-charge error:', e);
    return json({ success: false, error: 'שגיאת שרת. נסה שוב.' }, 500);
  }
});
