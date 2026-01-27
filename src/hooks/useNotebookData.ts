import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface NotebookEntry {
  id: string;
  notebook_id: string;
  lesson_id: string;
  module_id: string | null;
  chapter_id: string | null;
  lesson_title: string;
  video_url: string | null;
  video_timestamp: number | null;
  notes: string | null;
  created_at: string;
}

export interface NotebookMessage {
  id: string;
  entry_id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

// Notebooks CRUD
export const useNotebooks = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notebooks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_notebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notebook[];
    },
    enabled: !!user
  });
};

export const useCreateNotebook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (title: string = 'מחברת חדשה') => {
      if (!user) throw new Error('לא מחובר');
      
      const { data, error } = await supabase
        .from('user_notebooks')
        .insert({ user_id: user.id, title })
        .select()
        .single();
      
      if (error) throw error;
      return data as Notebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('מחברת חדשה נוצרה');
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת מחברת');
      console.error(error);
    }
  });
};

export const useUpdateNotebook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { data, error } = await supabase
        .from('user_notebooks')
        .update({ title })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Notebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('המחברת עודכנה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון המחברת');
      console.error(error);
    }
  });
};

export const useDeleteNotebook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_notebooks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('המחברת נמחקה');
    },
    onError: (error) => {
      toast.error('שגיאה במחיקת המחברת');
      console.error(error);
    }
  });
};

// Notebook Entries CRUD
export const useNotebookEntries = (notebookId: string) => {
  return useQuery({
    queryKey: ['notebook-entries', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_entries')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as NotebookEntry[];
    },
    enabled: !!notebookId
  });
};

export const useCreateNotebookEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: {
      notebook_id: string;
      lesson_id: string;
      module_id?: string;
      chapter_id?: string;
      lesson_title: string;
      video_url?: string;
      video_timestamp?: number;
    }) => {
      const { data, error } = await supabase
        .from('notebook_entries')
        .insert(entry)
        .select()
        .single();
      
      if (error) throw error;
      return data as NotebookEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook-entries', data.notebook_id] });
      toast.success('השיעור נוסף למחברת');
    },
    onError: (error) => {
      toast.error('שגיאה בהוספה למחברת');
      console.error(error);
    }
  });
};

export const useDeleteNotebookEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notebookId }: { id: string; notebookId: string }) => {
      const { error } = await supabase
        .from('notebook_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return notebookId;
    },
    onSuccess: (notebookId) => {
      queryClient.invalidateQueries({ queryKey: ['notebook-entries', notebookId] });
      toast.success('הרשומה נמחקה');
    },
    onError: (error) => {
      toast.error('שגיאה במחיקה');
      console.error(error);
    }
  });
};

// Messages CRUD
export const useNotebookMessages = (entryId: string) => {
  return useQuery({
    queryKey: ['notebook-messages', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_messages')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as NotebookMessage[];
    },
    enabled: !!entryId
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryId, sender, message }: { 
      entryId: string; 
      sender: 'user' | 'ai'; 
      message: string;
    }) => {
      const { data, error } = await supabase
        .from('notebook_messages')
        .insert({ entry_id: entryId, sender, message })
        .select()
        .single();
      
      if (error) throw error;
      return data as NotebookMessage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook-messages', data.entry_id] });
    }
  });
};

// Helper to get or create default notebook
export const useGetOrCreateDefaultNotebook = () => {
  const { user } = useAuth();
  const createNotebook = useCreateNotebook();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('לא מחובר');
      
      // Check for existing notebooks
      const { data: existing, error } = await supabase
        .from('user_notebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      
      if (existing && existing.length > 0) {
        return existing[0] as Notebook;
      }
      
      // Create default notebook
      const { data: newNotebook, error: createError } = await supabase
        .from('user_notebooks')
        .insert({ user_id: user.id, title: 'המחברת שלי' })
        .select()
        .single();
      
      if (createError) throw createError;
      return newNotebook as Notebook;
    }
  });
};

// AI Chat function
export const useSendAIMessage = () => {
  const queryClient = useQueryClient();
  const createMessage = useCreateMessage();
  
  return useMutation({
    mutationFn: async ({ 
      entryId, 
      userMessage, 
      lessonTitle,
      lessonDescription,
      videoUrl,
      conversationHistory
    }: { 
      entryId: string; 
      userMessage: string;
      lessonTitle: string;
      lessonDescription?: string;
      videoUrl?: string;
      conversationHistory: NotebookMessage[];
    }) => {
      // Save user message first
      await createMessage.mutateAsync({
        entryId,
        sender: 'user',
        message: userMessage
      });
      
      // Prepare messages for AI
      const messages = conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.message
      }));
      
      // Add current message
      messages.push({ role: 'user' as const, content: userMessage });
      
      // Call edge function
      const response = await supabase.functions.invoke('notebook-chat', {
        body: {
          messages,
          lessonContext: {
            title: lessonTitle,
            description: lessonDescription,
            videoUrl
          }
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'שגיאה בתקשורת עם AI');
      }
      
      // Save AI response
      const aiMessage = response.data?.message || 'מצטער, לא הצלחתי לעבד את הבקשה.';
      await createMessage.mutateAsync({
        entryId,
        sender: 'ai',
        message: aiMessage
      });
      
      return aiMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebook-messages', variables.entryId] });
    },
    onError: (error) => {
      toast.error('שגיאה בשליחת ההודעה');
      console.error(error);
    }
  });
};
