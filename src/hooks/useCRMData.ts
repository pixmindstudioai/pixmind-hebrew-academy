import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface CRMMessage {
  id: string;
  user_email: string;
  user_name: string | null;
  user_id: string | null;
  related_module_id: string | null;
  related_lesson_id: string | null;
  message_text: string;
  message_type: 'support' | 'question' | 'feedback' | 'purchase' | 'general';
  status: 'new' | 'viewed' | 'closed';
  assigned_to: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  viewed_at: string | null;
  closed_at: string | null;
  admin_notes: string | null;
  user?: any;
  module?: any;
  lesson?: any;
  assigned_user?: any;
}

export interface CRMFilters {
  status?: 'new' | 'viewed' | 'closed';
  messageType?: 'support' | 'question' | 'feedback' | 'purchase' | 'general';
  moduleId?: string;
  lessonId?: string;
  assignedTo?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Fetch all CRM messages with filters
export const useCRMMessages = (filters: CRMFilters = {}) => {
  return useQuery({
    queryKey: ['crm-messages', filters],
    queryFn: async () => {
      let query = supabase
        .from('crm_messages')
        .select(`
          *,
          user:users!crm_messages_user_id_fkey(id, full_name, email, profile_picture_url),
          module:modules(id, title),
          lesson:lessons(id, title),
          assigned_user:users!crm_messages_assigned_to_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType);
      }

      if (filters.moduleId) {
        query = query.eq('related_module_id', filters.moduleId);
      }

      if (filters.lessonId) {
        query = query.eq('related_lesson_id', filters.lessonId);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.searchTerm) {
        query = query.or(
          `user_email.ilike.%${filters.searchTerm}%,user_name.ilike.%${filters.searchTerm}%,message_text.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CRMMessage[];
    },
  });
};

// Fetch single message with all related data
export const useCRMMessage = (messageId: string) => {
  return useQuery({
    queryKey: ['crm-message', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_messages')
        .select(`
          *,
          user:users!crm_messages_user_id_fkey(id, full_name, email, profile_picture_url),
          module:modules(id, title),
          lesson:lessons(id, title),
          assigned_user:users!crm_messages_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      return data as CRMMessage;
    },
    enabled: !!messageId,
  });
};

// Fetch user's message history
export const useUserMessageHistory = (userEmail: string) => {
  return useQuery({
    queryKey: ['user-message-history', userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_messages')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMMessage[];
    },
    enabled: !!userEmail,
  });
};

// Update message status
export const useUpdateMessageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: 'new' | 'viewed' | 'closed' }) => {
      const { error } = await supabase.rpc('update_message_status', {
        p_message_id: messageId,
        p_status: status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      queryClient.invalidateQueries({ queryKey: ['crm-message'] });
      queryClient.invalidateQueries({ queryKey: ['crm-analytics'] });
      toast.success('סטטוס עודכן בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error updating message status:', error);
      toast.error('שגיאה בעדכון הסטטוס');
    },
  });
};

// Assign message to staff
export const useAssignMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, assignedTo }: { messageId: string; assignedTo: string | null }) => {
      const { error } = await supabase.rpc('assign_message', {
        p_message_id: messageId,
        p_assigned_to: assignedTo,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      queryClient.invalidateQueries({ queryKey: ['crm-message'] });
      toast.success('ההודעה הוקצתה בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error assigning message:', error);
      toast.error('שגיאה בהקצאת ההודעה');
    },
  });
};

// Update message tags and notes
export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      tags,
      adminNotes,
    }: {
      messageId: string;
      tags?: string[];
      adminNotes?: string;
    }) => {
      const updates: any = {};
      if (tags !== undefined) updates.tags = tags;
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;

      const { error } = await supabase
        .from('crm_messages')
        .update(updates)
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      queryClient.invalidateQueries({ queryKey: ['crm-message'] });
      toast.success('ההודעה עודכנה בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error updating message:', error);
      toast.error('שגיאה בעדכון ההודעה');
    },
  });
};

// CRM Analytics
export const useCRMAnalytics = () => {
  return useQuery({
    queryKey: ['crm-analytics'],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('crm_messages')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const messagesLast30Days = messages.filter(
        (m) => new Date(m.created_at) >= last30Days
      );
      const messagesLast7Days = messages.filter(
        (m) => new Date(m.created_at) >= last7Days
      );

      // Group by type
      const messagesByType = messages.reduce((acc: any, msg) => {
        acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
        return acc;
      }, {});

      // Group by module
      const messagesByModule: any = {};
      messages.forEach((msg) => {
        if (msg.related_module_id) {
          messagesByModule[msg.related_module_id] =
            (messagesByModule[msg.related_module_id] || 0) + 1;
        }
      });

      // Average resolution time (for closed messages)
      const closedMessages = messages.filter((m) => m.status === 'closed' && m.closed_at);
      const avgResolutionTime =
        closedMessages.length > 0
          ? closedMessages.reduce((sum, msg) => {
              const created = new Date(msg.created_at).getTime();
              const closed = new Date(msg.closed_at!).getTime();
              return sum + (closed - created);
            }, 0) / closedMessages.length
          : 0;

      // Messages per day (last 30 days)
      const messagesPerDay: any = {};
      messagesLast30Days.forEach((msg) => {
        const date = new Date(msg.created_at).toISOString().split('T')[0];
        messagesPerDay[date] = (messagesPerDay[date] || 0) + 1;
      });

      return {
        totalMessages: messages.length,
        newMessages: messages.filter((m) => m.status === 'new').length,
        viewedMessages: messages.filter((m) => m.status === 'viewed').length,
        closedMessages: messages.filter((m) => m.status === 'closed').length,
        messagesLast30Days: messagesLast30Days.length,
        messagesLast7Days: messagesLast7Days.length,
        messagesByType,
        messagesByModule,
        avgResolutionTimeHours: avgResolutionTime / (1000 * 60 * 60),
        messagesPerDay,
      };
    },
  });
};

// Realtime subscription hook
export const useCRMRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('crm-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
          queryClient.invalidateQueries({ queryKey: ['crm-analytics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
