import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface UserModuleAccess {
  id: string;
  user_email: string;
  module_id: string;
  expires_at: string | null;
  granted_at: string;
  granted_by: string | null;
  notes: string | null;
}

export const useUserModuleAccess = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['user-module-access', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data, error } = await supabase
        .from('user_module_access')
        .select('*')
        .eq('user_email', user.email.toLowerCase());
      
      if (error) {
        console.error('Error fetching user module access:', error);
        return [];
      }
      
      // Filter out expired access
      const currentTime = new Date();
      return (data || []).filter((access: UserModuleAccess) => 
        !access.expires_at || new Date(access.expires_at) > currentTime
      );
    },
    enabled: !!user?.email && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes for fresh access checks
  });

  // Set up real-time subscription for user access changes
  useEffect(() => {
    if (!user?.email) return;
    
    const channel = supabase
      .channel(`user-access-${user.email}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_module_access',
          filter: `user_email=eq.${user.email.toLowerCase()}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-module-access', user.email] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, queryClient]);

  return query;
};

export const useModuleAccess = () => {
  const { data: userAccess = [], isLoading } = useUserModuleAccess();
  
  // Create a Set of accessible module IDs for O(1) lookup
  const accessibleModuleIds = new Set(
    userAccess.map((access) => access.module_id)
  );
  
  const hasAccess = (moduleId: string) => {
    return accessibleModuleIds.has(moduleId);
  };
  
  const canAccessModule = (module: { id: string; is_paid: boolean }) => {
    return !module.is_paid || hasAccess(module.id);
  };
  
  return {
    userAccess,
    isLoading,
    hasAccess,
    canAccessModule,
  };
};