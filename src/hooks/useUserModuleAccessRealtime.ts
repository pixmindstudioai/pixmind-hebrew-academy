import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { UserModuleAccess } from './useUserModuleAccess';

export const useUserModuleAccessRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.email) return;

    // Create a channel for listening to user_module_access changes
    const channel = supabase
      .channel('user-module-access-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_module_access',
        },
        (payload) => {
          // Only process changes for the current user
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          if (newRecord?.user_email?.toLowerCase() === user.email.toLowerCase() || 
              oldRecord?.user_email?.toLowerCase() === user.email.toLowerCase()) {
            
            // Invalidate the query to trigger a refetch with the latest data
            queryClient.invalidateQueries({ queryKey: ['user-module-access', user.email] });
            
            // Handle different event types for more granular updates if needed
            switch (payload.eventType) {
              case 'INSERT':
                console.log('New module access granted:', payload.new);
                break;
              case 'UPDATE':
                console.log('Module access updated:', payload.new);
                break;
              case 'DELETE':
                console.log('Module access revoked:', payload.old);
                break;
            }
          }
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, queryClient]);

  return null;
};