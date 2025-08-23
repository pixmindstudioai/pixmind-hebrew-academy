
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Types for content data
export interface Module {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  order_index: number;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface Chapter {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  order_index: number;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  description: string;
  order_index: number;
  status: 'draft' | 'active' | 'archived';
  video_provider?: 'youtube' | 'vimeo' | 'file';
  video_url?: string;
  video_id?: string;
  video_start_time?: number;
  video_thumbnail?: string;
  rich_text?: string;
  duration_sec?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// Hook for fetching modules (with real-time updates)
export const useModules = (includeStatus?: 'active' | 'all') => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['modules', includeStatus],
    queryFn: async () => {
      let query = supabase
        .from('modules')
        .select('*')
        .order('order_index');
      
      if (includeStatus === 'active') {
        query = query.eq('status', 'active');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Module[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['modules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

// Hook for fetching chapters by module
export const useChapters = (moduleId: string, includeStatus?: 'active' | 'all') => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chapters', moduleId, includeStatus],
    queryFn: async () => {
      let query = supabase
        .from('chapters')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index');
      
      if (includeStatus === 'active') {
        query = query.eq('status', 'active');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Chapter[];
    },
    enabled: !!moduleId,
  });

  // Real-time subscription for chapters
  useEffect(() => {
    if (!moduleId) return;

    const channel = supabase
      .channel(`chapters-${moduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `module_id=eq.${moduleId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chapters', moduleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [moduleId, queryClient]);

  return query;
};

// Hook for fetching lessons by chapter
export const useLessons = (chapterId: string, includeStatus?: 'active' | 'all') => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lessons', chapterId, includeStatus],
    queryFn: async () => {
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('order_index');
      
      if (includeStatus === 'active') {
        query = query.eq('status', 'active');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!chapterId,
  });

  // Real-time subscription for lessons
  useEffect(() => {
    if (!chapterId) return;

    const channel = supabase
      .channel(`lessons-${chapterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `chapter_id=eq.${chapterId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapterId, queryClient]);

  return query;
};

// Hook for user progress
export const useUserProgress = (userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Real-time subscription for user progress
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`progress-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-progress', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
};

// Hook for fetching a single lesson with related data
export const useLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          chapters (
            id,
            title,
            module_id,
            modules (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      
      return lesson;
    },
    enabled: !!lessonId,
  });
};

// Hook for fetching lesson attachments
export const useLessonAttachments = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-attachments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });
};

// Hook for fetching lesson embeds
export const useLessonEmbeds = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-embeds', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_embeds')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });
};

// Hook for fetching lesson comments with user info
export const useLessonComments = (lessonId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          upvotes,
          parent_comment_id,
          user_id,
          users!inner (
            id,
            full_name
          )
        `)
        .eq('lesson_id', lessonId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!lessonId,
  });

  // Real-time subscription for comments
  useEffect(() => {
    if (!lessonId) return;

    const channel = supabase
      .channel(`comments-${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `lesson_id=eq.${lessonId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, queryClient]);

  return query;
};

// Hook for creating a comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, content, parentCommentId }: {
      lessonId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('משתמש לא מחובר');

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          lesson_id: lessonId,
          content,
          user_id: user.id,
          parent_comment_id: parentCommentId || null,
          status: 'approved' // Auto-approve for now
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', data.lesson_id] });
      toast.success('התגובה נשלחה בהצלחה');
    },
    onError: (error) => {
      toast.error('לא ניתן לפרסם תגובה. נסה שוב.');
      console.error('Error creating comment:', error);
    },
  });
};

// Hook for fetching lesson ratings
export const useLessonRatings = (lessonId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lesson-ratings', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_ratings')
        .select('*')
        .eq('lesson_id', lessonId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!lessonId,
  });

  // Real-time subscription for ratings
  useEffect(() => {
    if (!lessonId) return;

    const channel = supabase
      .channel(`ratings-${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_ratings',
          filter: `lesson_id=eq.${lessonId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lesson-ratings', lessonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, queryClient]);

  return query;
};

// Hook for creating or updating a lesson rating
export const useCreateOrUpdateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, rating }: {
      lessonId: string;
      rating: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('משתמש לא מחובר');

      const { data, error } = await supabase
        .from('lesson_ratings')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          rating,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-ratings', data.lesson_id] });
    },
    onError: (error) => {
      console.error('Error saving rating:', error);
    },
  });
};

// Hook for checking user progress on a lesson
export const useLessonProgress = (lessonId: string, userId?: string) => {
  return useQuery({
    queryKey: ['lesson-progress', lessonId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!lessonId && !!userId,
  });
};

// Hook for updating user progress
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, lessonId, completed }: {
      userId: string;
      lessonId: string;
      completed: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', data.user_id] });
      toast.success(data.completed ? 'השיעור הושלם!' : 'התקדמות נשמרה');
    },
    onError: (error) => {
      toast.error(`שגיאה בשמירת התקדמות: ${error.message}`);
    },
  });
};
