import { useEffect, useState, useCallback } from 'react';

// SUMIT (OfficeGuy) client-side card tokenization.
// payments.js depends on jQuery, so we load jQuery first, then the SUMIT script.
// OfficeGuy.Payments.CreateToken reads the form's data-og fields, tokenizes the card against
// SUMIT (using the PUBLIC key), and returns a single-use token via its Callback — the raw card
// details never touch our servers.

const JQUERY_SRC = 'https://code.jquery.com/jquery-3.7.1.min.js';
const SUMIT_SRC = 'https://app.sumit.co.il/scripts/payments.js';

// Public SUMIT credentials — safe to ship to the browser (they can ONLY create single-use card
// tokens, never charge; charging requires the secret API key which lives only in the edge function).
// Mirrors how the public Supabase key is embedded in src/integrations/supabase/client.ts.
// Override per-environment with VITE_SUMIT_COMPANY_ID / VITE_SUMIT_API_PUBLIC_KEY.
export const SUMIT_COMPANY_ID =
  (import.meta.env.VITE_SUMIT_COMPANY_ID as string) || '1732464018';
export const SUMIT_PUBLIC_KEY =
  (import.meta.env.VITE_SUMIT_API_PUBLIC_KEY as string) || 'xrZc5jN2YyidvnzSIAufP2qyENfmDgThYu1p3FJJS1C2qT5d1x';
/** Whether in-app SUMIT card checkout is configured (else we fall back to the external payment_url). */
export const sumitConfigured = Boolean(SUMIT_COMPANY_ID && SUMIT_PUBLIC_KEY);

function loadScript(src: string, isLoaded: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isLoaded()) return resolve();
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`failed to load ${src}`)));
      if (isLoaded()) resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function useSumitCheckout() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript(JQUERY_SRC, () => Boolean((window as any).jQuery));
        await loadScript(SUMIT_SRC, () => Boolean((window as any).OfficeGuy?.Payments));
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Tokenize the card in the given form (selector must point at a `<form>` containing the
   * SUMIT data-og inputs). Resolves to the SingleUseToken, or null if validation/tokenization
   * failed (SUMIT writes the human error into the form's `.og-errors` element automatically).
   */
  const createToken = useCallback((formSelector: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const og = (window as any).OfficeGuy?.Payments;
      if (!og || !sumitConfigured) return resolve(null);
      // Clear any token from a previous attempt so retries re-tokenize.
      const prev = document.querySelector(`${formSelector} [name="og-token"]`) as HTMLInputElement | null;
      if (prev) prev.value = '';
      og.CreateToken({
        FormSelector: formSelector,
        CompanyID: Number(SUMIT_COMPANY_ID),
        APIPublicKey: SUMIT_PUBLIC_KEY,
        ResponseLanguage: 'he',
        Callback: (token: string | null) => resolve(token || null),
      });
    });
  }, []);

  return { ready, loadError, createToken };
}
