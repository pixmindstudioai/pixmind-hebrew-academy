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

/**
 * Singleton realtime manager for `user_module_access`.
 *
 * `useUserModuleAccess` is consumed by `useModuleAccess`, which is mounted by
 * MANY components at once (e.g. every <ModuleCard> in a module list). If each
 * caller created its own Supabase channel, they would all share the topic
 * `user-access-<email>`; the 2nd+ caller receives the already-subscribed
 * channel and calling `.on('postgres_changes', …)` on it throws:
 *   "cannot add `postgres_changes` callbacks for realtime:… after `subscribe()`".
 * That single throw (with no error boundary above it) blanked the whole page.
 *
 * To fix this we keep exactly ONE channel per email and ref-count the callers.
 * The channel is created on the first subscriber and torn down when the last
 * one unsubscribes. A monotonic suffix guarantees the topic never collides with
 * a channel Supabase may still be tearing down asynchronously.
 */
type AccessRealtimeEntry = {
  channel: ReturnType<typeof supabase.channel>;
  refCount: number;
  listeners: Set<() => void>;
};

const accessRealtimeChannels = new Map<string, AccessRealtimeEntry>();
let accessChannelSeq = 0;

const subscribeUserAccessRealtime = (email: string, onChange: () => void): (() => void) => {
  const key = email.toLowerCase();
  let entry = accessRealtimeChannels.get(key);

  if (!entry) {
    const listeners = new Set<() => void>();
    accessChannelSeq += 1;
    const channel = supabase
      .channel(`user-access-${key}-${accessChannelSeq}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_module_access',
          filter: `user_email=eq.${key}`,
        },
        () => {
          listeners.forEach((cb) => cb());
        }
      )
      .subscribe();

    entry = { channel, refCount: 0, listeners };
    accessRealtimeChannels.set(key, entry);
  }

  entry.refCount += 1;
  entry.listeners.add(onChange);

  return () => {
    const current = accessRealtimeChannels.get(key);
    if (!current) return;
    current.listeners.delete(onChange);
    current.refCount -= 1;
    if (current.refCount <= 0) {
      supabase.removeChannel(current.channel);
      accessRealtimeChannels.delete(key);
    }
  };
};

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

  // Enable real-time subscription for user module access via a shared,
  // ref-counted channel so that many simultaneous callers (e.g. a grid of
  // ModuleCards) never collide on the same realtime topic.
  useEffect(() => {
    if (!user?.email) return;

    const email = user.email;
    const unsubscribe = subscribeUserAccessRealtime(email, () => {
      queryClient.invalidateQueries({ queryKey: ['user-module-access', email] });
    });

    return unsubscribe;
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