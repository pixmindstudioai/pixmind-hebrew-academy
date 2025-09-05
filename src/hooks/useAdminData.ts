
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
      is_paid?: boolean;
      payment_url?: string;
    }) => {
      // Check admin authentication via localStorage
      const adminAuth = localStorage.getItem('pixmind_admin_session');
      const sessionExpiry = localStorage.getItem('pixmind_admin_expiry');
      
      if (adminAuth !== 'true' || !sessionExpiry) {
        throw new Error('לא ניתן ליצור מודול – יש להתחבר כמנהל תחילה');
      }

      const now = Date.now();
      const expiry = parseInt(sessionExpiry, 10);
      
      if (now >= expiry) {
        // Session expired, clear it
        localStorage.removeItem('pixmind_admin_session');
        localStorage.removeItem('pixmind_admin_expiry');
        throw new Error('פג תוקף ההתחברות. יש להתחבר שוב');
      }

      // Use a placeholder admin ID for created_by since we're not using Supabase auth for admins
      const adminId = '00000000-0000-0000-0000-000000000000';

      // Insert module with admin placeholder ID
      const { data, error } = await supabase
        .from('modules')
        .insert([{ 
          ...moduleData, 
          created_by: adminId,
          order_index: moduleData.order_index ?? 0
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('אין לך הרשאה ליצור מודולים');
        }
        if (error.message.includes('permission denied')) {
          throw new Error('אין הרשאה ליצירת מודולים. נדרשת גישת מנהל');
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
            onClick: () => window.location.href = '/admin-login'
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
      is_paid?: boolean;
      payment_url?: string;
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

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, module_id }: { id: string; module_id: string }) => {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.message.includes('permission denied')) {
          throw new Error('אין הרשאה למחיקת פרקים. נדרשת גישת מנהל');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-chapters', variables.module_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] }); // Clear lessons cache
      toast.success('הפרק נמחק בהצלחה');
    },
    onError: (error) => {
      console.error('Chapter deletion error:', error);
      toast.error(`שגיאת הרשאה במחיקה: ${error.message}`);
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
    mutationFn: async (lessonData: any) => {
      // Ensure required fields are present
      if (!lessonData.chapter_id || !lessonData.title || !lessonData.description) {
        throw new Error('חסרים שדות חובה: פרק, כותרת ותיאור');
      }

      // Automatically calculate the next order_index for this chapter
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('chapter_id', lessonData.chapter_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingLessons && existingLessons.length > 0 
        ? (existingLessons[0].order_index || 0) + 1 
        : 0;

      // Extract only the fields that belong to the lessons table
      const cleanLessonData: any = {
        chapter_id: lessonData.chapter_id,
        title: lessonData.title,
        description: lessonData.description,
        status: lessonData.status || 'draft',
        order_index: nextOrderIndex // Use calculated order_index instead of user input
      };

      // Add optional fields only if they exist
      if (lessonData.video_provider) cleanLessonData.video_provider = lessonData.video_provider;
      if (lessonData.video_url) cleanLessonData.video_url = lessonData.video_url;
      if (lessonData.video_id) cleanLessonData.video_id = lessonData.video_id;
      if (lessonData.video_start_time !== undefined) cleanLessonData.video_start_time = lessonData.video_start_time;
      if (lessonData.video_thumbnail) cleanLessonData.video_thumbnail = lessonData.video_thumbnail;
      if (lessonData.rich_text) cleanLessonData.rich_text = lessonData.rich_text;
      if (lessonData.duration_sec !== undefined) cleanLessonData.duration_sec = lessonData.duration_sec;
      
      // Add JSONB fields
      if (lessonData.embeds) cleanLessonData.embeds = lessonData.embeds;
      if (lessonData.attachments) cleanLessonData.attachments = lessonData.attachments;

      console.log('Creating lesson with auto-calculated order_index:', nextOrderIndex);

      const { data, error } = await supabase
        .from('lessons')
        .insert([cleanLessonData])
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
      console.error('שגיאת יצירת שיעור:', error);
      if (error.message.includes('לא ניתן ליצור') || error.message.includes('אין לך הרשאה')) {
        toast.error(error.message, {
          action: {
            label: 'התחבר',
            onClick: () => window.location.href = '/admin-login'
          }
        });
      } else if (error.message.includes('duplicate key') && error.message.includes('order_index')) {
        toast.error('שגיאה: מספר סדר (order) כבר קיים בפרק זה');
      } else if (error.message.includes('chapter_id')) {
        toast.error('שגיאה ביצירת שיעור – חסר שדה פרק (chapter_id)');
      } else {
        toast.error(`שגיאה ביצירת השיעור: ${error.message}`);
      }
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: {
      id: string;
      chapter_id?: string;
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
      thumbnail_url?: string;
      links?: any[];
      attachments?: any[];
      embeds?: any[];
    }) => {
      // Admin authentication check
      const adminAuth = localStorage.getItem('pixmind_admin_session');
      const sessionExpiry = localStorage.getItem('pixmind_admin_expiry');
      
      if (adminAuth !== 'true' || !sessionExpiry) {
        throw new Error('אין הרשאה לעדכן שיעורים - יש להתחבר כמנהל');
      }

      const now = Date.now();
      const expiry = parseInt(sessionExpiry, 10);
      
      if (now >= expiry) {
        localStorage.removeItem('pixmind_admin_session');
        localStorage.removeItem('pixmind_admin_expiry');
        throw new Error('פג תוקף ההתחברות. יש להתחבר שוב');
      }

      const updates: any = { ...updateData };
      
      // Set published_at when status changes to active
      if (updateData.status === 'active') {
        updates.published_at = new Date().toISOString();
      }

      console.log('Updating lesson with payload:', updates);

      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Update lesson error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', data.chapter_id] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    onError: (error) => {
      console.error('Update lesson mutation error:', error);
      if (error.message.includes('התחבר')) {
        toast.error(error.message, {
          action: {
            label: 'התחבר',
            onClick: () => window.location.href = '/admin-login'
          }
        });
      } else {
        toast.error(`שגיאה בעדכון השיעור: ${error.message}`);
      }
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, chapter_id }: { id: string; chapter_id: string }) => {
      // Admin authentication check
      const adminAuth = localStorage.getItem('pixmind_admin_session');
      const sessionExpiry = localStorage.getItem('pixmind_admin_expiry');
      
      if (adminAuth !== 'true' || !sessionExpiry) {
        throw new Error('אין הרשאה למחיקת שיעורים - יש להתחבר כמנהל');
      }

      const now = Date.now();
      const expiry = parseInt(sessionExpiry, 10);
      
      if (now >= expiry) {
        localStorage.removeItem('pixmind_admin_session');
        localStorage.removeItem('pixmind_admin_expiry');
        throw new Error('פג תוקף ההתחברות. יש להתחבר שוב');
      }

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.message.includes('permission denied')) {
          throw new Error('אין הרשאה למחיקת שיעורים. נדרשת גישת מנהל');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', variables.chapter_id] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('השיעור נמחק בהצלחה');
    },
    onError: (error) => {
      console.error('Lesson deletion error:', error);
      if (error.message.includes('התחבר')) {
        toast.error(error.message, {
          action: {
            label: 'התחבר',
            onClick: () => window.location.href = '/admin-login'
          }
        });
      } else {
        toast.error(`שגיאת הרשאה במחיקה: ${error.message}`);
      }
    },
  });
};
