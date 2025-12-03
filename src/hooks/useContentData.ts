
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
  thumbnail_url?: string;
  order_index: number;
  status: 'draft' | 'active' | 'archived';
  is_paid: boolean;
  is_hidden: boolean;
  payment_url?: string;
  is_verified: boolean;
  regular_price?: number | null;
  sale_price?: number | null;
  sale_active?: boolean;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string;
  created_by: string;
}

export interface Chapter {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  order_index: number;
  status: 'draft' | 'active' | 'archived';
  visibility_mode?: string;
  cohort_id?: string | null;
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
  visibility_mode?: string;
  cohort_id?: string | null;
  video_provider?: 'youtube' | 'vimeo' | 'file';
  video_url?: string;
  video_id?: string;
  video_start_time?: number;
  video_thumbnail?: string;
  thumbnail_url?: string;
  rich_text?: string;
  duration_sec?: number;
  links?: Array<{label: string; url: string}> | null;
  attachments?: Array<{name: string; url: string; type: string; size: number}> | null;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// Hook for fetching verified public modules (Home page) - Issue E fix
export const useVerifiedModules = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['verified-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          chapters!inner(id)
        `)
        .eq('status', 'active')
        .eq('is_verified', true)
        .not('created_by', 'is', null)
        .order('order_index');
      
      if (error) throw error;
      return data as Module[];
    },
  });

  // Real-time subscription disabled in mock environment
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('verified-modules-changes')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'modules'
  //       },
  //       () => {
  //         queryClient.invalidateQueries({ queryKey: ['verified-modules'] });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [queryClient]);

  return query;
};

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

  // Real-time subscription disabled in mock environment
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('modules-changes')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'modules'
  //       },
  //       () => {
  //         queryClient.invalidateQueries({ queryKey: ['modules'] });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [queryClient]);

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

  // Real-time subscription disabled in mock environment
  // useEffect(() => {
  //   if (!moduleId) return;

  //   const channel = supabase
  //     .channel(`chapters-${moduleId}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'chapters',
  //         filter: `module_id=eq.${moduleId}`
  //       },
  //       () => {
  //         queryClient.invalidateQueries({ queryKey: ['chapters', moduleId] });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [moduleId, queryClient]);

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
      
      // Parse JSON fields safely with proper typing
      const lessons = (data || []).map(lesson => ({
        ...lesson,
        links: lesson.links && Array.isArray(lesson.links) 
          ? lesson.links as Array<{label: string; url: string}> 
          : null,
        attachments: lesson.attachments && Array.isArray(lesson.attachments) 
          ? lesson.attachments as Array<{name: string; url: string; type: string; size: number}>
          : null,
      })) as Lesson[];
      
      return lessons;
    },
    enabled: !!chapterId,
  });

  // Real-time subscription disabled in mock environment
  // useEffect(() => {
  //   if (!chapterId) return;

  //   const channel = supabase
  //     .channel(`lessons-${chapterId}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'lessons',
  //         filter: `chapter_id=eq.${chapterId}`
  //       },
  //       () => {
  //         queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [chapterId, queryClient]);

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

  // Real-time subscription disabled in mock environment
  // useEffect(() => {
  //   if (!userId) return;

  //   const channel = supabase
  //     .channel(`progress-${userId}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'user_progress',
  //         filter: `user_id=eq.${userId}`
  //       },
  //       () => {
  //         queryClient.invalidateQueries({ queryKey: ['user-progress', userId] });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [userId, queryClient]);

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
      
      // Parse JSON fields safely with proper typing
      const parsedLesson = {
        ...lesson,
        links: lesson.links && Array.isArray(lesson.links) 
          ? lesson.links as Array<{label: string; url: string}> 
          : null,
        attachments: lesson.attachments && Array.isArray(lesson.attachments) 
          ? lesson.attachments as Array<{name: string; url: string; type: string; size: number}>
          : null,
      } as any; // Cast as any to avoid type conflicts with Supabase relations
      
      return parsedLesson;
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

// Hook for fetching lesson comments (secure - no user_id exposure)
export const useLessonComments = (lessonId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_comments_public')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected interface
      return (data || []).map(comment => ({
        ...comment,
        users: {
          full_name: comment.user_name
        }
      }));
    },
    enabled: !!lessonId,
  });

  // Real-time subscription disabled in mock environment
  // useEffect(() => {
  //   if (!lessonId) return;

  //   const channel = supabase
  //     .channel(`comments-${lessonId}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'comments',
  //         filter: `lesson_id=eq.${lessonId}`
  //       },
  //       () => {
  //         queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [lessonId, queryClient]);

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

// Hook for fetching lesson rating statistics (aggregated, no user IDs exposed)
export const useLessonRatingStats = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-rating-stats', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_rating_stats')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    },
    enabled: !!lessonId,
  });
};

// Hook for fetching current user's rating for a lesson (secure - only their own)
export const useUserLessonRating = (lessonId: string) => {
  return useQuery({
    queryKey: ['user-lesson-rating', lessonId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('lesson_ratings')
        .select('rating')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.rating || 0;
    },
    enabled: !!lessonId,
  });
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
      // Invalidate both the aggregated stats and user rating
      queryClient.invalidateQueries({ queryKey: ['lesson-rating-stats', data.lesson_id] });
      queryClient.invalidateQueries({ queryKey: ['user-lesson-rating', data.lesson_id] });
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
