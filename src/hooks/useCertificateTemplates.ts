import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CertificateConfig } from '@/lib/certificate';

export interface CertificateTemplate {
  id: string;
  module_id: string;
  name: string;
  template_image_url: string;
  config: CertificateConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = (moduleId?: string) => ['certificate-template', moduleId ?? null];

/**
 * Fetch the certificate template for a given module (or null when none exists).
 * Disabled when moduleId is undefined/empty.
 */
export function useCertificateTemplate(moduleId?: string) {
  return useQuery({
    queryKey: QUERY_KEY(moduleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('module_id', moduleId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        config: (data.config as unknown as CertificateConfig) ?? { fields: [], signatures: [] },
      } as CertificateTemplate;
    },
    enabled: !!moduleId,
  });
}

interface UpsertPayload {
  module_id: string;
  name: string;
  template_image_url: string;
  config: CertificateConfig;
  is_active?: boolean;
}

/**
 * Upsert a certificate template. On success invalidates the template query
 * and shows a success toast.
 */
export function useUpsertCertificateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpsertPayload) => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .upsert(
          {
            module_id: payload.module_id,
            name: payload.name,
            template_image_url: payload.template_image_url,
            config: payload.config as unknown as Record<string, unknown>,
            is_active: payload.is_active ?? true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'module_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(variables.module_id) });
      toast.success('התבנית נשמרה');
    },
    onError: (error: Error) => {
      toast.error(`שגיאה בשמירת התבנית: ${error.message}`);
    },
  });
}

/**
 * Upload a certificate template image to the 'thumbnails' bucket under
 * certificates/templates/<moduleId>-<timestamp>.<ext> and return its public URL.
 */
export async function uploadCertificateTemplateImage(
  file: File,
  moduleId: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `certificates/templates/${moduleId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('thumbnails')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(`שגיאה בהעלאת התמונה: ${uploadError.message}`);

  const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
  return data.publicUrl;
}
