import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Bridge to native StoreKit running in the iOS app's WKWebView.
// Web → native: window.webkit.messageHandlers.iap.postMessage({ action, productId, requestId })
// Native → web: window.__iapCallback({ requestId, ok, transactionId, environment, transactions, error })
// After native confirms the purchase, the web verifies + grants via the apple-iap-verify function
// (which runs with the user's Supabase session — so auth stays in the web layer).

interface IapMsg {
  requestId?: string;
  ok: boolean;
  transactionId?: string;
  environment?: 'Production' | 'Sandbox';
  transactions?: Array<{ transactionId: string; environment?: 'Production' | 'Sandbox'; productId?: string }>;
  error?: string;
}

const pending = new Map<string, (m: IapMsg) => void>();
let installed = false;
// Lets the out-of-band deliver handler refresh access without holding a React ref.
let sharedInvalidate: (() => void) | null = null;

function ensureCallback() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  // Native → web reply for a specific purchase/restore request.
  (window as any).__iapCallback = (raw: unknown) => {
    try {
      const msg: IapMsg = typeof raw === 'string' ? JSON.parse(raw) : (raw as IapMsg);
      const resolver = msg?.requestId ? pending.get(msg.requestId) : undefined;
      if (resolver) {
        pending.delete(msg.requestId!);
        resolver(msg);
      }
    } catch {
      /* ignore malformed native messages */
    }
  };
  // Native pushes transactions that arrive outside a request (deferred Ask-to-Buy approvals,
  // late completions after a timeout, Transaction.updates) — verify + unlock them too.
  (window as any).__iapDeliver = async (raw: unknown) => {
    try {
      const msg = typeof raw === 'string' ? JSON.parse(raw) : (raw as IapMsg);
      if (!msg?.transactionId) return;
      const { data } = await supabase.functions.invoke('apple-iap-verify', {
        body: { transactionId: msg.transactionId, environment: msg.environment },
      });
      if (data?.success) sharedInvalidate?.();
    } catch {
      /* ignore */
    }
  };
}

/** True only inside the native iOS app (the StoreKit bridge is present). */
export function isNativeIOSApp(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).webkit?.messageHandlers?.iap);
}

function postToNative(payload: Record<string, unknown>): Promise<IapMsg> {
  return new Promise((resolve) => {
    ensureCallback();
    const requestId = `iap_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let settled = false;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: 'timeout' });
      }
    }, 180000);
    pending.set(requestId, (m) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve(m);
      }
    });
    try {
      (window as any).webkit.messageHandlers.iap.postMessage({ ...payload, requestId });
    } catch {
      clearTimeout(timer);
      pending.delete(requestId);
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: 'bridge_error' });
      }
    }
  });
}

export function useIapPurchase() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const invalidateAccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-module-access'] });
    queryClient.invalidateQueries({ queryKey: ['user-bundle-access'] });
  }, [queryClient]);

  // Expose access-refresh to the out-of-band __iapDeliver handler (late/deferred transactions).
  useEffect(() => {
    sharedInvalidate = invalidateAccess;
    return () => {
      if (sharedInvalidate === invalidateAccess) sharedInvalidate = null;
    };
  }, [invalidateAccess]);

  const purchase = useCallback(async (productId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isNativeIOSApp()) return { ok: false, error: 'not-native' };
    setBusy(true);
    try {
      // Bind the purchase to THIS user (appAccountToken) so a shared Apple ID can't move it later.
      const { data: sess } = await supabase.auth.getUser();
      const appAccountToken = sess?.user?.id;
      const native = await postToNative({ action: 'purchase', productId, appAccountToken });
      if (!native.ok || !native.transactionId) {
        return { ok: false, error: native.error || 'purchase_failed' };
      }
      const { data, error } = await supabase.functions.invoke('apple-iap-verify', {
        body: { transactionId: native.transactionId, environment: native.environment },
      });
      if (error || !data?.success) return { ok: false, error: data?.error || 'verify_failed' };
      invalidateAccess();
      return { ok: true };
    } finally {
      setBusy(false);
    }
  }, [invalidateAccess]);

  const restore = useCallback(async (): Promise<{ ok: boolean; restored: number; failed: number; error?: string }> => {
    if (!isNativeIOSApp()) return { ok: false, restored: 0, failed: 0, error: 'not-native' };
    setBusy(true);
    try {
      const native = await postToNative({ action: 'restore' });
      if (!native.ok) return { ok: false, restored: 0, failed: 0, error: native.error };
      let restored = 0;
      let failed = 0;
      for (const t of native.transactions ?? []) {
        try {
          const { data, error } = await supabase.functions.invoke('apple-iap-verify', {
            body: { transactionId: t.transactionId, environment: t.environment },
          });
          if (data?.success) restored++;
          else if (error || !data) failed++;
        } catch {
          failed++;
        }
      }
      invalidateAccess();
      return { ok: true, restored, failed };
    } finally {
      setBusy(false);
    }
  }, [invalidateAccess]);

  return { available: isNativeIOSApp(), busy, purchase, restore };
}
