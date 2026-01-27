import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';
import type { Bundle, BundleWithModules, UserBundleAccess } from '@/types/bundle';

// Fetch all active bundles with their included modules
export const useBundles = () => {
  return useQuery({
    queryKey: ['bundles'],
    queryFn: async () => {
      // Fetch bundles
      const { data: bundles, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .eq('status', 'active')
        .order('order_index');

      if (bundlesError) throw bundlesError;

      // Fetch bundle-module relationships
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
            description
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

// Fetch user's bundle access
export const useUserBundleAccess = () => {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user-bundle-access', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('user_bundle_access')
        .select('*')
        .eq('user_email', user.email.toLowerCase());

      if (error) {
        console.error('Error fetching user bundle access:', error);
        return [];
      }

      // Filter out expired access
      const currentTime = new Date();
      return (data || []).filter((access: UserBundleAccess) =>
        !access.expires_at || new Date(access.expires_at) > currentTime
      );
    },
    enabled: !!user?.email && isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for bundle access logic
export const useBundleAccess = () => {
  const { data: userBundleAccess = [], isLoading } = useUserBundleAccess();

  // Create a Set of accessible bundle IDs for O(1) lookup
  const accessibleBundleIds = useMemo(() => new Set(
    userBundleAccess.map((access) => access.bundle_id)
  ), [userBundleAccess]);

  const hasBundleAccess = (bundleId: string) => {
    return accessibleBundleIds.has(bundleId);
  };

  const canAccessBundle = (bundle: { id: string; is_paid: boolean }) => {
    // Free bundles are accessible to all
    if (!bundle.is_paid) return true;

    // User has explicit access record
    if (hasBundleAccess(bundle.id)) return true;

    return false;
  };

  return {
    userBundleAccess,
    isLoading,
    hasBundleAccess,
    canAccessBundle,
  };
};
