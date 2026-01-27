import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface LessonTask {
  id: string;
  lesson_id: string;
  instructions: string;
  allowed_types: string[];
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string | null;
  user_email: string;
  submission_type: 'text' | 'file' | 'image';
  content_text: string | null;
  content_url: string | null;
  ai_status: 'pending' | 'approved' | 'rejected';
  ai_confidence: number | null;
  ai_explanation: string | null;
  manual_override: boolean;
  manual_status: 'approved' | 'rejected' | null;
  manual_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  lesson_tasks?: LessonTask;
  lessons?: {
    id: string;
    title: string;
    chapter_id: string;
    chapters?: {
      id: string;
      title: string;
      module_id: string;
      modules?: {
        id: string;
        title: string;
      };
    };
  };
}

// Fetch task for a specific lesson
export const useLessonTask = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-task', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_tasks')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as LessonTask | null;
    },
    enabled: !!lessonId,
  });
};

// Fetch all tasks for admin management
export const useAllTasks = () => {
  return useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_tasks')
        .select(`
          *,
          lessons!inner (
            id,
            title,
            chapter_id,
            chapters!inner (
              id,
              title,
              module_id,
              modules!inner (
                id,
                title
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch user's task submission for a specific task
export const useUserTaskSubmission = (taskId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task-submission', taskId, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_email', user.email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TaskSubmission | null;
    },
    enabled: !!taskId && !!user?.email,
  });
};

// Fetch all submissions for a task (admin view)
export const useTaskSubmissions = (taskId: string) => {
  return useQuery({
    queryKey: ['task-submissions', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaskSubmission[];
    },
    enabled: !!taskId,
  });
};

// Fetch all user's tasks with submissions grouped by course
export const useUserTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      // First get all tasks for active lessons
      const { data: tasks, error: tasksError } = await supabase
        .from('lesson_tasks')
        .select(`
          *,
          lessons!inner (
            id,
            title,
            order_index,
            chapter_id,
            chapters!inner (
              id,
              title,
              order_index,
              module_id,
              modules!inner (
                id,
                title
              )
            )
          )
        `)
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      // Get user's submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('user_email', user.email.toLowerCase());

      if (submissionsError) throw submissionsError;

      // Get user's module access
      const { data: access, error: accessError } = await supabase
        .from('user_module_access')
        .select('module_id')
        .eq('user_email', user.email.toLowerCase());

      if (accessError) throw accessError;

      const accessedModuleIds = new Set(access?.map(a => a.module_id) || []);

      // Check for free modules (not paid)
      const { data: modules } = await supabase
        .from('modules')
        .select('id, is_paid')
        .eq('is_paid', false);

      const freeModuleIds = new Set(modules?.map(m => m.id) || []);

      // Combine tasks with submissions, filtering by access
      const tasksWithSubmissions = (tasks || [])
        .filter(task => {
          const moduleId = (task as any).lessons?.chapters?.module_id;
          return freeModuleIds.has(moduleId) || accessedModuleIds.has(moduleId);
        })
        .map(task => {
          const submission = submissions?.find(s => s.task_id === task.id);
          return {
            ...task,
            submission,
          };
        })
        .sort((a, b) => {
          // Sort by module, then chapter, then lesson order
          const aModule = (a as any).lessons?.chapters?.modules?.title || '';
          const bModule = (b as any).lessons?.chapters?.modules?.title || '';
          if (aModule !== bModule) return aModule.localeCompare(bModule);

          const aChapterOrder = (a as any).lessons?.chapters?.order_index || 0;
          const bChapterOrder = (b as any).lessons?.chapters?.order_index || 0;
          if (aChapterOrder !== bChapterOrder) return aChapterOrder - bChapterOrder;

          const aLessonOrder = (a as any).lessons?.order_index || 0;
          const bLessonOrder = (b as any).lessons?.order_index || 0;
          return aLessonOrder - bLessonOrder;
        });

      return tasksWithSubmissions;
    },
    enabled: !!user?.email,
  });
};

// Create or update a lesson task
export const useUpsertLessonTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<LessonTask, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      if (task.id) {
        // Update existing
        const { data, error } = await supabase
          .from('lesson_tasks')
          .update({
            instructions: task.instructions,
            allowed_types: task.allowed_types,
            is_mandatory: task.is_mandatory,
            is_active: task.is_active,
          })
          .eq('id', task.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('lesson_tasks')
          .insert({
            lesson_id: task.lesson_id,
            instructions: task.instructions,
            allowed_types: task.allowed_types,
            is_mandatory: task.is_mandatory,
            is_active: task.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-task', variables.lesson_id] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
};

// Delete a lesson task
export const useDeleteLessonTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, lessonId }: { taskId: string; lessonId: string }) => {
      const { error } = await supabase
        .from('lesson_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { taskId, lessonId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-task', data.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
};

// Submit a task
export const useSubmitTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      submissionType,
      contentText,
      contentUrl,
    }: {
      taskId: string;
      submissionType: 'text' | 'file' | 'image';
      contentText?: string;
      contentUrl?: string;
    }) => {
      if (!user?.email) throw new Error('User not authenticated');

      // Insert submission
      const { data: submission, error: submitError } = await supabase
        .from('task_submissions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          user_email: user.email.toLowerCase(),
          submission_type: submissionType,
          content_text: contentText || null,
          content_url: contentUrl || null,
          ai_status: 'pending',
        })
        .select()
        .single();

      if (submitError) throw submitError;

      // Trigger AI validation via edge function
      try {
        const { error: funcError } = await supabase.functions.invoke('validate-task', {
          body: { submissionId: submission.id },
        });

        if (funcError) {
          console.error('AI validation error:', funcError);
          // Don't throw - submission is still saved, AI will be retried
        }
      } catch (e) {
        console.error('Failed to invoke validate-task:', e);
      }

      return submission;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-submission', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    },
  });
};

// Admin: Override submission status
export const useOverrideSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      status,
      adminId,
    }: {
      submissionId: string;
      status: 'approved' | 'rejected';
      adminId: string;
    }) => {
      const { data, error } = await supabase
        .from('task_submissions')
        .update({
          manual_override: true,
          manual_status: status,
          manual_by: adminId,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-submission', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task-submissions', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    },
  });
};

// Check if user can proceed to next lesson (no mandatory pending/rejected tasks)
export const useCanProceedToLesson = (lessonId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-proceed', lessonId, user?.email],
    queryFn: async () => {
      if (!user?.email || !lessonId) return { canProceed: true, blockedByTaskId: null };

      // Get the lesson's chapter and find previous lessons
      const { data: lesson } = await supabase
        .from('lessons')
        .select('chapter_id, order_index')
        .eq('id', lessonId)
        .single();

      if (!lesson) return { canProceed: true, blockedByTaskId: null };

      // Get previous lessons in the same chapter
      const { data: previousLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('chapter_id', lesson.chapter_id)
        .lt('order_index', lesson.order_index)
        .order('order_index', { ascending: false });

      if (!previousLessons?.length) return { canProceed: true, blockedByTaskId: null };

      // Check each previous lesson for mandatory tasks
      for (const prevLesson of previousLessons) {
        const { data: task } = await supabase
          .from('lesson_tasks')
          .select('id')
          .eq('lesson_id', prevLesson.id)
          .eq('is_active', true)
          .eq('is_mandatory', true)
          .maybeSingle();

        if (task) {
          // Check if user has an approved submission
          const { data: submission } = await supabase
            .from('task_submissions')
            .select('id, ai_status, manual_override, manual_status')
            .eq('task_id', task.id)
            .eq('user_email', user.email.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const isApproved = submission && (
            (submission.manual_override && submission.manual_status === 'approved') ||
            (!submission.manual_override && submission.ai_status === 'approved')
          );

          if (!isApproved) {
            return { canProceed: false, blockedByTaskId: task.id, blockedByLessonId: prevLesson.id };
          }
        }
      }

      return { canProceed: true, blockedByTaskId: null };
    },
    enabled: !!lessonId && !!user?.email,
  });
};

// Helper to get effective submission status
export const getEffectiveStatus = (submission: TaskSubmission | null): 'none' | 'pending' | 'approved' | 'rejected' => {
  if (!submission) return 'none';
  if (submission.manual_override) {
    return submission.manual_status || 'pending';
  }
  return submission.ai_status;
};
