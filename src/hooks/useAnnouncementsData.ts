import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean;
  is_pinned: boolean;
  access_type: 'all' | 'restricted';
  publish_date: string;
  expire_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementVisibility {
  id: string;
  announcement_id: string;
  module_id: string | null;
  bundle_id: string | null;
  created_at: string;
  module?: { id: string; title: string };
  bundle?: { id: string; title: string };
}

// Admin hooks
export const useAdminAnnouncements = () => {
  return useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
  });
};

export const useAnnouncementVisibility = (announcementId: string | null) => {
  return useQuery({
    queryKey: ['announcement-visibility', announcementId],
    queryFn: async () => {
      if (!announcementId) return [];
      
      const { data, error } = await supabase
        .from('announcement_visibility')
        .select(`
          *,
          module:modules(id, title),
          bundle:bundles(id, title)
        `)
        .eq('announcement_id', announcementId);
      
      if (error) throw error;
      return data as AnnouncementVisibility[];
    },
    enabled: !!announcementId,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (announcement: {
      title: string;
      content: string;
      image_url?: string;
      is_active?: boolean;
      is_pinned?: boolean;
      access_type?: 'all' | 'restricted';
      publish_date?: string;
      expire_date?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          content: announcement.content,
          image_url: announcement.image_url || null,
          is_active: announcement.is_active ?? true,
          is_pinned: announcement.is_pinned ?? false,
          access_type: announcement.access_type || 'all',
          publish_date: announcement.publish_date || new Date().toISOString(),
          expire_date: announcement.expire_date || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('ההכרזה נוצרה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת ההכרזה');
      console.error(error);
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Announcement> & { id: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['user-announcements'] });
      toast.success('ההכרזה עודכנה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון ההכרזה');
      console.error(error);
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('ההכרזה נמחקה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה במחיקת ההכרזה');
      console.error(error);
    },
  });
};

export const useAddAnnouncementVisibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (visibility: { announcement_id: string; module_id?: string; bundle_id?: string }) => {
      const { data, error } = await supabase
        .from('announcement_visibility')
        .insert(visibility)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcement-visibility', variables.announcement_id] });
      toast.success('הרשאת צפייה נוספה');
    },
    onError: (error) => {
      toast.error('שגיאה בהוספת הרשאה');
      console.error(error);
    },
  });
};

export const useRemoveAnnouncementVisibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, announcementId }: { id: string; announcementId: string }) => {
      const { error } = await supabase
        .from('announcement_visibility')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return announcementId;
    },
    onSuccess: (announcementId) => {
      queryClient.invalidateQueries({ queryKey: ['announcement-visibility', announcementId] });
      toast.success('הרשאת צפייה הוסרה');
    },
    onError: (error) => {
      toast.error('שגיאה בהסרת הרשאה');
      console.error(error);
    },
  });
};

// User hooks
export const useUserAnnouncements = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-announcements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .lte('publish_date', new Date().toISOString())
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false });
      
      if (error) throw error;
      
      // Filter out expired announcements
      return (data as Announcement[]).filter(a => 
        !a.expire_date || new Date(a.expire_date) > new Date()
      );
    },
    enabled: !!user,
  });
};

export const useAnnouncement = (id: string | null) => {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Announcement;
    },
    enabled: !!id,
  });
};
