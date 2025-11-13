import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommentReply {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'hidden' | 'flagged';
  upvotes: number;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    profile_picture_url?: string;
  };
}

export interface CommentWithDetails {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'hidden' | 'flagged';
  upvotes: number;
  report_count: number;
  created_at: string;
  updated_at: string;
  lesson_id: string;
  user_id: string;
  parent_comment_id?: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    profile_picture_url?: string;
  };
  lesson: {
    id: string;
    title: string;
    chapter_id: string;
    chapter: {
      id: string;
      title: string;
      module_id: string;
      module: {
        id: string;
        title: string;
      };
    };
  };
  replies?: CommentReply[];
}

export interface CommentFilters {
  moduleId?: string;
  lessonId?: string;
  userId?: string;
  status?: 'pending' | 'approved' | 'hidden' | 'flagged';
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// Fetch all comments with filters
export const useComments = (filters?: CommentFilters) => {
  return useQuery({
    queryKey: ['admin-comments', filters],
    queryFn: async () => {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey(id, full_name, email, profile_picture_url),
          lesson:lessons!comments_lesson_id_fkey(
            id,
            title,
            chapter_id,
            chapter:chapters!lessons_chapter_id_fkey(
              id,
              title,
              module_id,
              module:modules!chapters_module_id_fkey(id, title)
            )
          )
        `)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.lessonId) {
        query = query.eq('lesson_id', filters.lessonId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      let comments = data as any[] as CommentWithDetails[];

      // Filter by module if needed
      if (filters?.moduleId) {
        comments = comments.filter(c => c.lesson.chapter.module_id === filters.moduleId);
      }

      // Search filter (client-side for simplicity)
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        comments = comments.filter(c => 
          c.content.toLowerCase().includes(term) ||
          c.user.full_name.toLowerCase().includes(term) ||
          c.user.email.toLowerCase().includes(term) ||
          c.lesson.title.toLowerCase().includes(term)
        );
      }

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              user:users!comments_user_id_fkey(id, full_name, email, profile_picture_url)
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || []
          };
        })
      );

      return commentsWithReplies;
    },
  });
};

// Fetch comment count per lesson
export const useLessonCommentCounts = (lessonIds: string[]) => {
  return useQuery({
    queryKey: ['lesson-comment-counts', lessonIds],
    queryFn: async () => {
      if (lessonIds.length === 0) return {};

      const { data, error } = await supabase
        .from('comments')
        .select('lesson_id, status')
        .in('lesson_id', lessonIds);

      if (error) throw error;

      const counts: Record<string, { total: number; approved: number; pending: number }> = {};
      
      data.forEach(comment => {
        if (!counts[comment.lesson_id]) {
          counts[comment.lesson_id] = { total: 0, approved: 0, pending: 0 };
        }
        counts[comment.lesson_id].total++;
        if (comment.status === 'approved') {
          counts[comment.lesson_id].approved++;
        } else if (comment.status === 'pending') {
          counts[comment.lesson_id].pending++;
        }
      });

      return counts;
    },
    enabled: lessonIds.length > 0,
  });
};

// Update comment status
export const useUpdateCommentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: 'approved' | 'hidden' | 'flagged' }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['lesson-comment-counts'] });
      
      const statusLabels = {
        approved: 'אושרה',
        hidden: 'הוסתרה',
        flagged: 'סומנה'
      };
      toast.success(`התגובה ${statusLabels[variables.status]} בהצלחה`);
    },
    onError: (error) => {
      console.error('Error updating comment status:', error);
      toast.error('שגיאה בעדכון סטטוס התגובה');
    },
  });
};

// Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      // First delete all replies
      const { error: repliesError } = await supabase
        .from('comments')
        .delete()
        .eq('parent_comment_id', commentId);

      if (repliesError) throw repliesError;

      // Then delete the comment itself
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['lesson-comment-counts'] });
      toast.success('התגובה נמחקה בהצלחה');
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast.error('שגיאה במחיקת התגובה');
    },
  });
};

// Edit comment content
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      toast.success('התגובה עודכנה בהצלחה');
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      toast.error('שגיאה בעדכון התגובה');
    },
  });
};
