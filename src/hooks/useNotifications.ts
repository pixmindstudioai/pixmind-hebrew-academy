import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'follow' | 'like' | 'comment' | 'message' | 'course_access' | 'chapter' | string;
  title: string;
  body: string | null;
  route: string | null;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Persistent in-app notifications backed by public.notifications (Phase 1).
 * Reads the latest rows for the signed-in user, keeps an unread count, and
 * subscribes to Realtime INSERTs so the bell updates live while the app is open.
 */
export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.id;

  const query = useQuery({
    queryKey: ['notifications', uid],
    queryFn: async (): Promise<AppNotification[]> => {
      if (!uid) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return (data ?? []) as AppNotification[];
    },
    enabled: !!uid && isAuthenticated,
    staleTime: 30 * 1000,
  });

  // Live: a new notification for me → refetch the list (bell badge updates).
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', uid] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications', uid] });
  };

  const markAllAsRead = async () => {
    if (!uid) return;
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', uid)
      .eq('is_read', false);
    queryClient.invalidateQueries({ queryKey: ['notifications', uid] });
  };

  return { notifications, unreadCount, isLoading: query.isLoading, markAsRead, markAllAsRead };
};
