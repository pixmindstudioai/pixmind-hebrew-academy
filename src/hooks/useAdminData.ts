
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Module operations
export const useModules = () => {
  return useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (moduleData: {
      title: string;
      description: string;
      status: 'draft' | 'active' | 'archived';
      order_index?: number;
    }) => {
      // Get the current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('לא ניתן ליצור מודול – יש להתחבר תחילה');
      }

      // Insert module with the authenticated user's ID
      const { data, error } = await supabase
        .from('modules')
        .insert([{ 
          ...moduleData, 
          created_by: session.user.id,
          order_index: moduleData.order_index ?? 0
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('אין לך הרשאה ליצור מודולים');
        }
        throw new Error(`שגיאה ביצירת המודול: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('מודול נוצר בהצלחה!');
    },
    onError: (error) => {
      console.error('Module creation error:', error);
      if (error.message.includes('התחבר')) {
        toast.error(error.message, {
          action: {
            label: 'התחבר',
            onClick: () => window.location.href = '/login'
          }
        });
      } else {
        toast.error(error.message);
      }
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: {
      id: string;
      title?: string;
      description?: string;
      status?: 'draft' | 'active' | 'archived';
      order_index?: number;
    }) => {
      const updates: any = { ...updateData };
      
      // Set published_at when status changes to active
      if (updateData.status === 'active') {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      toast.success('המודול עודכן בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון המודול: ${error.message}`);
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      toast.success('המודול נמחק בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה במחיקת המודול: ${error.message}`);
    },
  });
};

// Chapter operations
export const useChapters = (moduleId?: string) => {
  return useQuery({
    queryKey: ['admin-chapters', moduleId],
    queryFn: async () => {
      let query = supabase
        .from('chapters')
        .select('*')
        .order('order_index');
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });
};

export const useCreateChapter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chapterData: {
      module_id: string;
      title: string;
      description?: string;
      status: 'draft' | 'active' | 'archived';
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from('chapters')
        .insert([chapterData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-chapters', data.module_id] });
      toast.success('הפרק נוצר בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה ביצירת הפרק: ${error.message}`);
    },
  });
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: {
      id: string;
      title?: string;
      description?: string;
      status?: 'draft' | 'active' | 'archived';
      order_index?: number;
    }) => {
      const updates: any = { ...updateData };
      
      if (updateData.status === 'active') {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-chapters', data.module_id] });
      toast.success('הפרק עודכן בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון הפרק: ${error.message}`);
    },
  });
};

// Lesson operations
export const useLessons = (chapterId?: string) => {
  return useQuery({
    queryKey: ['admin-lessons', chapterId],
    queryFn: async () => {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('order_index');
      
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!chapterId,
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lessonData: {
      chapter_id: string;
      title: string;
      description: string;
      status: 'draft' | 'active' | 'archived';
      order_index?: number;
      video_provider?: 'youtube' | 'vimeo' | 'file';
      video_url?: string;
      video_id?: string;
      video_start_time?: number;
      video_thumbnail?: string;
      rich_text?: string;
      duration_sec?: number;
    }) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', data.chapter_id] });
      toast.success('השיעור נוצר בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה ביצירת השיעור: ${error.message}`);
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: {
      id: string;
      title?: string;
      description?: string;
      status?: 'draft' | 'active' | 'archived';
      order_index?: number;
      video_provider?: 'youtube' | 'vimeo' | 'file';
      video_url?: string;
      video_id?: string;
      video_start_time?: number;
      video_thumbnail?: string;
      rich_text?: string;
      duration_sec?: number;
    }) => {
      const updates: any = { ...updateData };
      
      if (updateData.status === 'active') {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', data.chapter_id] });
      toast.success('השיעור עודכן בהצלחה');
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון השיעור: ${error.message}`);
    },
  });
};
