import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Bundle, BundleWithModules } from '@/types/bundle';

// Fetch all bundles with their modules (for admin)
export const useAdminBundles = () => {
  return useQuery({
    queryKey: ['admin-bundles'],
    queryFn: async () => {
      // Fetch all bundles (including drafts for admin)
      const { data: bundles, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .order('order_index');

      if (bundlesError) throw bundlesError;

      // Fetch bundle-module relationships with module details
      const { data: bundleModules, error: bmError } = await supabase
        .from('bundle_modules')
        .select(`
          bundle_id,
          module_id,
          order_index,
          modules (
            id,
            title,
            thumbnail_url,
            description,
            is_paid
          )
        `)
        .order('order_index');

      if (bmError) throw bmError;

      // Combine bundles with their modules
      const bundlesWithModules: BundleWithModules[] = (bundles || []).map((bundle: Bundle) => ({
        ...bundle,
        modules: (bundleModules || [])
          .filter((bm: any) => bm.bundle_id === bundle.id)
          .map((bm: any) => bm.modules)
          .filter(Boolean)
      }));

      return bundlesWithModules;
    },
  });
};

// Fetch a single bundle by ID
export const useAdminBundle = (bundleId: string | undefined) => {
  return useQuery({
    queryKey: ['admin-bundle', bundleId],
    queryFn: async () => {
      if (!bundleId) return null;

      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (bundleError) throw bundleError;

      // Fetch modules in this bundle
      const { data: bundleModules, error: bmError } = await supabase
        .from('bundle_modules')
        .select(`
          module_id,
          order_index,
          modules (
            id,
            title,
            thumbnail_url,
            description,
            is_paid
          )
        `)
        .eq('bundle_id', bundleId)
        .order('order_index');

      if (bmError) throw bmError;

      return {
        ...bundle,
        modules: (bundleModules || []).map((bm: any) => bm.modules).filter(Boolean)
      } as BundleWithModules;
    },
    enabled: !!bundleId,
  });
};

// Create bundle
export const useCreateBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundleData: {
      title: string;
      description?: string;
      thumbnail_url?: string;
      status: 'draft' | 'active' | 'archived';
      is_paid: boolean;
      regular_price?: number | null;
      sale_price?: number | null;
      sale_active?: boolean;
      sale_start_date?: string | null;
      sale_end_date?: string | null;
      payment_url?: string;
      order_index?: number;
      module_ids?: string[];
    }) => {
      const { module_ids, ...bundleFields } = bundleData;

      // Insert bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .insert([{
          ...bundleFields,
          order_index: bundleFields.order_index ?? 0
        }])
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Insert bundle-module relationships if modules provided
      if (module_ids && module_ids.length > 0) {
        const bundleModulesData = module_ids.map((moduleId, index) => ({
          bundle_id: bundle.id,
          module_id: moduleId,
          order_index: index
        }));

        const { error: bmError } = await supabase
          .from('bundle_modules')
          .insert(bundleModulesData);

        if (bmError) throw bmError;
      }

      return bundle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      toast.success('החבילה נוצרה בהצלחה!');
    },
    onError: (error) => {
      console.error('Bundle creation error:', error);
      toast.error(`שגיאה ביצירת החבילה: ${error.message}`);
    },
  });
};

// Update bundle
export const useUpdateBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, module_ids, ...updateData }: {
      id: string;
      title?: string;
      description?: string;
      thumbnail_url?: string;
      status?: 'draft' | 'active' | 'archived';
      is_paid?: boolean;
      regular_price?: number | null;
      sale_price?: number | null;
      sale_active?: boolean;
      sale_start_date?: string | null;
      sale_end_date?: string | null;
      payment_url?: string;
      order_index?: number;
      module_ids?: string[];
    }) => {
      // Update bundle fields
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Update bundle-module relationships if module_ids provided
      if (module_ids !== undefined) {
        // Delete existing relationships
        const { error: deleteError } = await supabase
          .from('bundle_modules')
          .delete()
          .eq('bundle_id', id);

        if (deleteError) throw deleteError;

        // Insert new relationships
        if (module_ids.length > 0) {
          const bundleModulesData = module_ids.map((moduleId, index) => ({
            bundle_id: id,
            module_id: moduleId,
            order_index: index
          }));

          const { error: insertError } = await supabase
            .from('bundle_modules')
            .insert(bundleModulesData);

          if (insertError) throw insertError;
        }
      }

      return bundle;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bundle', data.id] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      toast.success('החבילה עודכנה בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון החבילה: ${error.message}`);
    },
  });
};

// Delete bundle
export const useDeleteBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete bundle-module relationships first
      const { error: bmError } = await supabase
        .from('bundle_modules')
        .delete()
        .eq('bundle_id', id);

      if (bmError) throw bmError;

      // Delete bundle
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      toast.success('החבילה נמחקה בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה במחיקת החבילה: ${error.message}`);
    },
  });
};

// Grant bundle access to user
export const useGrantBundleAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bundle_id: string;
      user_email: string;
      expires_at?: string | null;
      notes?: string;
    }) => {
      const { data: access, error } = await supabase
        .from('user_bundle_access')
        .insert([{
          bundle_id: data.bundle_id,
          user_email: data.user_email.toLowerCase(),
          expires_at: data.expires_at || null,
          notes: data.notes || null
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('למשתמש זה כבר יש גישה לחבילה זו');
        }
        throw error;
      }

      return access;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bundle-access'] });
      toast.success('הגישה לחבילה ניתנה בהצלחה');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Revoke bundle access
export const useRevokeBundleAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bundleId, userEmail }: { bundleId: string; userEmail: string }) => {
      const { error } = await supabase
        .from('user_bundle_access')
        .delete()
        .eq('bundle_id', bundleId)
        .eq('user_email', userEmail.toLowerCase());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bundle-access'] });
      toast.success('הגישה לחבילה הוסרה');
    },
    onError: (error) => {
      toast.error(`שגיאה בהסרת הגישה: ${error.message}`);
    },
  });
};
