import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolSetting {
  id: string;
  tool_name: string;
  is_enabled: boolean;
  allowed_roles: string[];
  rate_limit_per_minute: number;
  description_he: string;
  description_en: string;
  category: string;
  updated_at: string;
}

export interface ToolUsageLog {
  id: string;
  tool_name: string;
  actor_email: string;
  actor_role: string;
  module_id: string | null;
  lesson_id: string | null;
  status: string;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

// Hook to call MCP tools
export const useMCPTool = () => {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const callTool = async (toolName: string, params: Record<string, any> = {}): Promise<MCPToolResult> => {
    if (!session?.access_token) {
      return { success: false, error: 'יש להתחבר כדי להשתמש בכלי זה' };
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-tools`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tool: toolName, params }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'שגיאה בהפעלת הכלי' };
      }

      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'שגיאת רשת' };
    } finally {
      setIsLoading(false);
    }
  };

  return { callTool, isLoading };
};

// Hook to get tool settings (admin)
export const useToolSettings = () => {
  return useQuery({
    queryKey: ['mcp-tool-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcp_tool_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as ToolSetting[];
    },
  });
};

// Hook to update tool settings (admin)
export const useUpdateToolSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toolName, updates }: { toolName: string; updates: Partial<ToolSetting> }) => {
      const { error } = await supabase
        .from('mcp_tool_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('tool_name', toolName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-tool-settings'] });
    },
  });
};

// Hook to get tool usage logs (admin)
export const useToolUsageLogs = (filters?: {
  toolName?: string;
  actorEmail?: string;
  status?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['mcp-tool-usage-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('tool_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.toolName) {
        query = query.eq('tool_name', filters.toolName);
      }
      if (filters?.actorEmail) {
        query = query.ilike('actor_email', `%${filters.actorEmail}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ToolUsageLog[];
    },
  });
};

// Hook for student learning tools
export const useLearningTools = (lessonId: string) => {
  const { callTool, isLoading } = useMCPTool();

  const summarize = (length: 'short' | 'medium' | 'long' = 'medium', language: 'he' | 'en' = 'he') =>
    callTool('summarize_lesson', { lessonId, length, language });

  const explain = (concept: string, language: 'he' | 'en' = 'he') =>
    callTool('explain_concept', { lessonId, concept, language });

  const getTakeaways = (language: 'he' | 'en' = 'he') =>
    callTool('extract_key_takeaways', { lessonId, language });

  const getExamples = (topic?: string, level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate', language: 'he' | 'en' = 'he') =>
    callTool('generate_examples', { lessonId, topic, level, language });

  const createFlashcards = (count: number = 10, language: 'he' | 'en' = 'he') =>
    callTool('create_flashcards', { lessonId, count, language });

  const generateQuiz = (numQuestions: number = 5, difficulty: 'easy' | 'medium' | 'hard' = 'medium', language: 'he' | 'en' = 'he') =>
    callTool('generate_quiz', { lessonId, numQuestions, difficulty, language });

  const checkUnderstanding = (userAnswers?: any[], language: 'he' | 'en' = 'he') =>
    callTool('check_understanding', { lessonId, userAnswers, language });

  const getActionPlan = (horizonHours: 6 | 24 | 48 | 72 = 24, language: 'he' | 'en' = 'he') =>
    callTool('lesson_action_plan', { lessonId, horizonHours, language });

  const draftComment = (intent: 'question' | 'insight' | 'feedback' = 'question', language: 'he' | 'en' = 'he') =>
    callTool('draft_comment', { lessonId, intent, language });

  return {
    isLoading,
    summarize,
    explain,
    getTakeaways,
    getExamples,
    createFlashcards,
    generateQuiz,
    checkUnderstanding,
    getActionPlan,
    draftComment,
  };
};

// Tool categories for UI
export const TOOL_CATEGORIES = {
  learning: { label: 'כלי למידה', labelEn: 'Learning Tools' },
  resources: { label: 'משאבים', labelEn: 'Resources' },
  navigation: { label: 'ניווט והתקדמות', labelEn: 'Navigation' },
  community: { label: 'קהילה', labelEn: 'Community' },
  support: { label: 'תמיכה', labelEn: 'Support' },
  admin_content: { label: 'ניהול תוכן', labelEn: 'Content Management' },
  admin_moderation: { label: 'מודרציה', labelEn: 'Moderation' },
  admin_users: { label: 'ניהול משתמשים', labelEn: 'User Management' },
  admin_payments: { label: 'תשלומים', labelEn: 'Payments' },
  admin_crm: { label: 'פניות', labelEn: 'CRM' },
  admin_ops: { label: 'תפעול', labelEn: 'Operations' },
  bonus: { label: 'כלים משותפים', labelEn: 'Shared Tools' },
};

// Tool icons mapping
export const TOOL_ICONS: Record<string, string> = {
  summarize_lesson: '📝',
  explain_concept: '💡',
  extract_key_takeaways: '🎯',
  generate_examples: '📚',
  create_flashcards: '🃏',
  generate_quiz: '❓',
  check_understanding: '✅',
  lesson_action_plan: '📋',
  summarize_attachment: '📎',
  extract_links_and_notes: '🔗',
  my_progress_overview: '📊',
  recommend_next_lesson: '➡️',
  set_learning_goal: '🎯',
  draft_comment: '💬',
  rephrase_comment: '✍️',
  report_issue: '🚨',
  search_content: '🔍',
  list_modules: '📁',
  view_user_access: '🔐',
};
