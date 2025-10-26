import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CourseAccessNotification {
  id: string;
  moduleId: string;
  moduleTitle: string;
  grantedAt: string;
  provider: string;
  isRead: boolean;
}

export const useCourseAccessNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<CourseAccessNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    const userEmail = user.email.toLowerCase();

    // Subscribe to realtime changes on user_module_access
    const channel = supabase
      .channel(`course-access-${userEmail}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_module_access',
          filter: `user_email=eq.${userEmail}`
        },
        async (payload) => {
          const newAccess = payload.new as any;

          // Prevent duplicate notifications
          if (processedIds.current.has(newAccess.id)) {
            return;
          }
          processedIds.current.add(newAccess.id);

          // Fetch module details
          const { data: moduleData } = await supabase
            .from('modules')
            .select('title')
            .eq('id', newAccess.module_id)
            .single();

          const moduleTitle = moduleData?.title || 'קורס חדש';

          // Create notification object
          const notification: CourseAccessNotification = {
            id: newAccess.id,
            moduleId: newAccess.module_id,
            moduleTitle,
            grantedAt: newAccess.granted_at,
            provider: newAccess.provider || 'manual',
            isRead: false,
          };

          // Add to notifications list (keep last 5)
          setNotifications((prev) => [notification, ...prev].slice(0, 5));
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast.success(`🎉 נפתחה לך גישה לקורס החדש שלך – ${moduleTitle}!`, {
            duration: 6000,
            action: {
              label: 'צפה בקורס',
              onClick: () => window.location.href = `/courses/${newAccess.module_id}`,
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, isAuthenticated]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    processedIds.current.clear();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};

