import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Types for admin task review
export interface TaskSubmissionWithDetails {
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
  // Joined user info
  users?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  // Joined task info with lesson/chapter/module
  lesson_tasks?: {
    id: string;
    instructions: string;
    is_mandatory: boolean;
    lessons?: {
      id: string;
      title: string;
      chapters?: {
        id: string;
        title: string;
        modules?: {
          id: string;
          title: string;
        };
      };
    };
  };
}

// Fetch all submissions for admin review with full details
export const useAllTaskSubmissions = () => {
  return useQuery({
    queryKey: ['admin-all-task-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_submissions')
        .select(`
          *,
          lesson_tasks (
            id,
            instructions,
            is_mandatory,
            lessons (
              id,
              title,
              chapters (
                id,
                title,
                modules (
                  id,
                  title
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details separately since we can't join auth.users directly
      const userEmails = [...new Set(data?.map(s => s.user_email) || [])];
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('email', userEmails);

      const userMap = new Map(users?.map(u => [u.email.toLowerCase(), u]) || []);

      return (data || []).map(submission => ({
        ...submission,
        users: userMap.get(submission.user_email.toLowerCase()) || null,
      })) as TaskSubmissionWithDetails[];
    },
  });
};

// Admin override submission status with audit logging
export const useAdminOverrideSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      newStatus,
      previousStatus,
      adminNotes,
    }: {
      submissionId: string;
      newStatus: 'approved' | 'rejected';
      previousStatus: string;
      adminNotes?: string;
    }) => {
      if (!user?.id) throw new Error('Admin not authenticated');

      // Update the submission
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('task_submissions')
        .update({
          manual_override: true,
          manual_status: newStatus,
          manual_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // On approval, award the challenge's XP (server-authoritative, idempotent).
      if (newStatus === 'approved') {
        const { error: xpError } = await supabase.rpc('approve_submission_xp', {
          p_submission_id: submissionId,
        });
        if (xpError) console.error('approve_submission_xp failed:', xpError);
      }

      // Log the admin action to audit log
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action: 'task_submission_override',
          entity_type: 'task_submission',
          entity_id: submissionId,
          changes: {
            previous_status: previousStatus,
            new_status: newStatus,
            admin_notes: adminNotes || null,
            manual_override: true,
          },
        });

      if (auditError) {
        console.error('Failed to log audit:', auditError);
        // Don't throw - the main action succeeded
      }

      return updatedSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-task-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['task-submission'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
};

// Get effective status helper
export const getEffectiveSubmissionStatus = (submission: TaskSubmissionWithDetails): string => {
  if (submission.manual_override && submission.manual_status) {
    return submission.manual_status;
  }
  return submission.ai_status;
};

// Get status display info
export const getStatusDisplayInfo = (status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  switch (status) {
    case 'approved':
      return { label: 'אושר', variant: 'default' };
    case 'rejected':
      return { label: 'נדחה', variant: 'destructive' };
    case 'pending':
      return { label: 'ממתין לבדיקה', variant: 'secondary' };
    default:
      return { label: status, variant: 'outline' };
  }
};
