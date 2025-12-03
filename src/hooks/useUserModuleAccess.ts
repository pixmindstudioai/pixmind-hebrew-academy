import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useMemo } from 'react';

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

  // Enable real-time subscription for user module access
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

// Hook to get user's created_at date for legacy free access check
export const useUserCreatedAt = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-created-at', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user created_at:', error);
        return null;
      }
      
      return data?.created_at || null;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // User's created_at never changes
  });
};

export const useModuleAccess = () => {
  const { data: userAccess = [], isLoading } = useUserModuleAccess();
  const { data: userCreatedAt } = useUserCreatedAt();
  
  // Create a Set of accessible module IDs for O(1) lookup
  const accessibleModuleIds = useMemo(() => new Set(
    userAccess.map((access) => access.module_id)
  ), [userAccess]);
  
  const hasAccess = (moduleId: string) => {
    return accessibleModuleIds.has(moduleId);
  };
  
  // Check if user is a legacy free user for a specific module
  const isLegacyFreeUser = (module: { 
    was_free_before?: boolean; 
    became_paid_at?: string | null;
  }) => {
    if (!module.was_free_before || !module.became_paid_at || !userCreatedAt) {
      return false;
    }
    
    const userDate = new Date(userCreatedAt);
    const becamePaidDate = new Date(module.became_paid_at);
    
    return userDate < becamePaidDate;
  };
  
  const canAccessModule = (module: { 
    id: string; 
    is_paid: boolean;
    was_free_before?: boolean;
    became_paid_at?: string | null;
  }) => {
    // Free modules are accessible to all
    if (!module.is_paid) return true;
    
    // User has explicit access record
    if (hasAccess(module.id)) return true;
    
    // User is a legacy free user
    if (isLegacyFreeUser(module)) return true;
    
    return false;
  };
  
  return {
    userAccess,
    isLoading,
    hasAccess,
    canAccessModule,
    isLegacyFreeUser,
  };
};