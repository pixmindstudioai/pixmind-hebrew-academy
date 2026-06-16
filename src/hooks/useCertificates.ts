import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { renderCertificate } from '@/lib/renderCertificate';
import type { CertificateConfig } from '@/lib/certificate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IssuedCertificate {
  id: string;
  user_id: string;
  module_id: string;
  template_id: string | null;
  certificate_url: string | null;
  verification_code: string;
  issued_at: string;
  modules: { title: string } | null;
}

// Sentinel to suppress the catch-all toast in onError when mutationFn
// already showed a specific toast and re-threw.
const ALREADY_TOASTED = '__already_toasted__';

// ---------------------------------------------------------------------------
// Query: list all certificates for the signed-in user
// ---------------------------------------------------------------------------

export function useMyCertificates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-certificates', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<IssuedCertificate[]> => {
      if (!user?.id) return [];
      // cast: certificates_issued is not yet in the generated types
      const { data, error } = await (supabase as any)
        .from('certificates_issued')
        .select('*, modules(title)')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      if (error) {
        console.error('useMyCertificates error', error);
        return [];
      }
      return (data ?? []) as IssuedCertificate[];
    },
  });
}

// ---------------------------------------------------------------------------
// Query: certificate for one module (own profile)
// ---------------------------------------------------------------------------

export function useModuleCertificate(moduleId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['module-certificate', user?.id, moduleId],
    enabled: !!user?.id && !!moduleId,
    staleTime: 30_000,
    queryFn: async (): Promise<IssuedCertificate | null> => {
      if (!user?.id || !moduleId) return null;
      // cast: certificates_issued is not yet in the generated types
      const { data, error } = await (supabase as any)
        .from('certificates_issued')
        .select('*, modules(title)')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      if (error) {
        console.error('useModuleCertificate error', error);
        return null;
      }
      return (data as IssuedCertificate | null) ?? null;
    },
  });
}

// ---------------------------------------------------------------------------
// Query: is the module fully completed?
// ---------------------------------------------------------------------------

export function useModuleComplete(moduleId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['module-complete', user?.id, moduleId],
    enabled: !!user?.id && !!moduleId,
    staleTime: 30_000,
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !moduleId) return false;
      // cast: is_module_complete is not yet in the generated types
      const { data, error } = await (supabase as any).rpc('is_module_complete', {
        p_user_id: user.id,
        p_module_id: moduleId,
      });
      if (error) {
        console.error('useModuleComplete error', error);
        return false;
      }
      return Boolean(data);
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: issue (or retrieve) a certificate and return its public URL
// ---------------------------------------------------------------------------

// Map DB error messages to friendly Hebrew strings
function friendlyError(msg: string): string {
  if (msg.includes('module not completed') || msg.includes('not completed')) {
    return 'יש להשלים את הקורס תחילה';
  }
  return msg;
}

export function useIssueCertificate() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string): Promise<string> => {
      if (!user?.id) {
        const msg = 'יש להתחבר תחילה';
        toast.error(msg);
        throw Object.assign(new Error(msg), { [ALREADY_TOASTED]: true });
      }

      // ── Step 1: call issue_certificate RPC ────────────────────────────────
      // cast: issue_certificate is not yet in the generated types
      const { data: cert, error: issueError } = await (supabase as any).rpc(
        'issue_certificate',
        { p_module_id: moduleId }
      );
      if (issueError) {
        const msg = friendlyError(issueError.message ?? '');
        toast.error(msg);
        throw Object.assign(new Error(msg), { [ALREADY_TOASTED]: true });
      }

      const certRow = cert as {
        id: string;
        certificate_url: string | null;
        user_id: string;
        module_id: string;
        template_id: string | null;
        verification_code: string;
        issued_at: string;
      } | null;

      // ── Step 2: if already has a URL, return it immediately ───────────────
      if (certRow?.certificate_url) {
        return certRow.certificate_url;
      }

      // ── Step 3: load the certificate template for this module ─────────────
      // cast: certificate_templates is not yet in the generated types
      const { data: tplRows, error: tplError } = await (supabase as any)
        .from('certificate_templates')
        .select('template_image_url, config')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .limit(1);

      if (tplError) {
        toast.error('שגיאה בטעינת תבנית התעודה');
        throw Object.assign(tplError, { [ALREADY_TOASTED]: true });
      }
      if (!tplRows || tplRows.length === 0) {
        const msg = 'עדיין אין תבנית תעודה לקורס זה';
        toast.error(msg);
        throw Object.assign(new Error(msg), { [ALREADY_TOASTED]: true });
      }

      const tpl = tplRows[0] as {
        template_image_url: string;
        config: CertificateConfig;
      };

      // ── Step 4: fetch student's names fresh ───────────────────────────────
      // full_name_en is a new column not yet in the generated types — cast select result
      const { data: me, error: meError } = await (supabase as any)
        .from('users')
        .select('full_name, full_name_en')
        .eq('id', user.id)
        .single();

      if (meError) {
        toast.error('שגיאה בטעינת פרטי המשתמש');
        throw Object.assign(meError, { [ALREADY_TOASTED]: true });
      }

      const meTyped = me as { full_name?: string | null; full_name_en?: string | null } | null;

      // ── Step 5: render the certificate on a canvas ────────────────────────
      let blob: Blob;
      try {
        blob = await renderCertificate(
          tpl.template_image_url,
          tpl.config,
          { full_name: meTyped?.full_name, full_name_en: meTyped?.full_name_en }
        );
      } catch (renderErr: any) {
        toast.error('שגיאה ביצירת התעודה');
        throw Object.assign(renderErr instanceof Error ? renderErr : new Error(String(renderErr)), {
          [ALREADY_TOASTED]: true,
        });
      }

      // ── Step 6: upload to storage ─────────────────────────────────────────
      const storagePath = `certificates/issued/${user.id}/${moduleId}.png`;
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(storagePath, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) {
        toast.error('שגיאה בהעלאת התעודה');
        throw Object.assign(uploadError, { [ALREADY_TOASTED]: true });
      }

      // ── Step 7: get public URL ─────────────────────────────────────────────
      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // ── Step 8: persist the URL on the issued certificate row ─────────────
      // cast: set_certificate_url is not yet in the generated types
      const { error: setUrlError } = await (supabase as any).rpc('set_certificate_url', {
        p_module_id: moduleId,
        p_url: publicUrl,
      });
      if (setUrlError) {
        // Non-fatal: the cert was generated; log but continue
        console.error('set_certificate_url error', setUrlError);
      }

      // ── Step 9: invalidate caches ─────────────────────────────────────────
      qc.invalidateQueries({ queryKey: ['my-certificates', user.id] });
      qc.invalidateQueries({ queryKey: ['module-certificate', user.id, moduleId] });

      return publicUrl;
    },

    onError: (err: any) => {
      // Only show the generic fallback toast when mutationFn did NOT already
      // toast a specific message (indicated by the ALREADY_TOASTED sentinel).
      if (!err?.[ALREADY_TOASTED]) {
        toast.error('שגיאה בהוצאת התעודה');
      }
    },
  });
}
