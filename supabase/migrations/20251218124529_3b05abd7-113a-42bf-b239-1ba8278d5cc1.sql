-- Create tool_usage_logs table for tracking MCP tool calls
CREATE TABLE IF NOT EXISTS public.tool_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('student', 'admin')),
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  input_params jsonb,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
  error_message text,
  response_preview text,
  execution_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_tool_usage_logs_actor_email ON public.tool_usage_logs(actor_email);
CREATE INDEX idx_tool_usage_logs_tool_name ON public.tool_usage_logs(tool_name);
CREATE INDEX idx_tool_usage_logs_created_at ON public.tool_usage_logs(created_at DESC);
CREATE INDEX idx_tool_usage_logs_module_id ON public.tool_usage_logs(module_id);

-- Enable RLS
ALTER TABLE public.tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view all tool logs"
ON public.tool_usage_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can insert logs (from edge functions)
CREATE POLICY "System can insert tool logs"
ON public.tool_usage_logs
FOR INSERT
WITH CHECK (true);

-- Users can view their own logs
CREATE POLICY "Users can view own tool logs"
ON public.tool_usage_logs
FOR SELECT
USING (actor_email = auth.email());

-- Create mcp_tool_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.mcp_tool_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  allowed_roles text[] NOT NULL DEFAULT ARRAY['student', 'admin'],
  rate_limit_per_minute integer DEFAULT 10,
  description_he text,
  description_en text,
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.mcp_tool_settings ENABLE ROW LEVEL SECURITY;

-- Admin can manage tool settings
CREATE POLICY "Admins can manage tool settings"
ON public.mcp_tool_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can read enabled tools
CREATE POLICY "Anyone can read tool settings"
ON public.mcp_tool_settings
FOR SELECT
USING (true);

-- Insert default tool settings
INSERT INTO public.mcp_tool_settings (tool_name, category, description_he, description_en, allowed_roles) VALUES
-- Student tools
('summarize_lesson', 'learning', 'סיכום שיעור בהתאם לאורך ושפה', 'Summarize a lesson by length and language', ARRAY['student', 'admin']),
('explain_concept', 'learning', 'הסבר מושג מתוך השיעור', 'Explain a concept from the lesson', ARRAY['student', 'admin']),
('extract_key_takeaways', 'learning', 'חילוץ נקודות מפתח מהשיעור', 'Extract key takeaways from lesson', ARRAY['student', 'admin']),
('generate_examples', 'learning', 'יצירת דוגמאות מותאמות לרמה', 'Generate examples by difficulty level', ARRAY['student', 'admin']),
('create_flashcards', 'learning', 'יצירת כרטיסיות לימוד', 'Create flashcards from lesson', ARRAY['student', 'admin']),
('generate_quiz', 'learning', 'יצירת חידון מהשיעור', 'Generate quiz from lesson', ARRAY['student', 'admin']),
('check_understanding', 'learning', 'בדיקת הבנה עם משוב', 'Check understanding with feedback', ARRAY['student', 'admin']),
('lesson_action_plan', 'learning', 'תוכנית פעולה לאחר השיעור', 'Action plan after lesson', ARRAY['student', 'admin']),
('summarize_attachment', 'resources', 'סיכום קובץ מצורף', 'Summarize an attachment', ARRAY['student', 'admin']),
('extract_links_and_notes', 'resources', 'חילוץ קישורים והערות', 'Extract links and notes', ARRAY['student', 'admin']),
('my_progress_overview', 'navigation', 'סקירת התקדמות אישית', 'Personal progress overview', ARRAY['student', 'admin']),
('recommend_next_lesson', 'navigation', 'המלצה לשיעור הבא', 'Recommend next lesson', ARRAY['student', 'admin']),
('set_learning_goal', 'navigation', 'הגדרת יעד לימוד', 'Set learning goal', ARRAY['student', 'admin']),
('draft_comment', 'community', 'טיוטת תגובה לשיעור', 'Draft a comment', ARRAY['student', 'admin']),
('rephrase_comment', 'community', 'ניסוח מחדש של טקסט', 'Rephrase text', ARRAY['student', 'admin']),
('report_issue', 'support', 'דיווח על בעיה', 'Report an issue', ARRAY['student', 'admin']),
-- Admin tools
('admin_create_module', 'admin_content', 'יצירת מודול חדש', 'Create new module', ARRAY['admin']),
('admin_update_module', 'admin_content', 'עדכון מודול', 'Update module', ARRAY['admin']),
('admin_create_chapter', 'admin_content', 'יצירת פרק חדש', 'Create new chapter', ARRAY['admin']),
('admin_create_lesson', 'admin_content', 'יצירת שיעור חדש', 'Create new lesson', ARRAY['admin']),
('admin_bulk_publish', 'admin_content', 'פרסום מרובה', 'Bulk publish', ARRAY['admin']),
('admin_content_audit', 'admin_content', 'ביקורת תוכן', 'Content audit', ARRAY['admin']),
('admin_list_comments', 'admin_moderation', 'רשימת תגובות', 'List comments', ARRAY['admin']),
('admin_moderate_comment', 'admin_moderation', 'ניהול תגובה', 'Moderate comment', ARRAY['admin']),
('admin_comment_insights', 'admin_moderation', 'תובנות תגובות', 'Comment insights', ARRAY['admin']),
('admin_find_user', 'admin_users', 'חיפוש משתמש', 'Find user', ARRAY['admin']),
('admin_grant_access', 'admin_users', 'הענקת גישה', 'Grant access', ARRAY['admin']),
('admin_revoke_access', 'admin_users', 'ביטול גישה', 'Revoke access', ARRAY['admin']),
('admin_set_cohort', 'admin_users', 'הגדרת מחזור', 'Set cohort', ARRAY['admin']),
('admin_user_profile_view', 'admin_users', 'צפייה בפרופיל משתמש', 'View user profile', ARRAY['admin']),
('admin_reset_progress', 'admin_users', 'איפוס התקדמות', 'Reset progress', ARRAY['admin']),
('admin_list_purchases', 'admin_payments', 'רשימת רכישות', 'List purchases', ARRAY['admin']),
('admin_reconcile_purchase', 'admin_payments', 'התאמת רכישה', 'Reconcile purchase', ARRAY['admin']),
('admin_trigger_webhook_test', 'admin_payments', 'בדיקת webhook', 'Test webhook', ARRAY['admin']),
('admin_fix_missing_access', 'admin_payments', 'תיקון גישות חסרות', 'Fix missing access', ARRAY['admin']),
('admin_crm_list_tickets', 'admin_crm', 'רשימת פניות', 'List tickets', ARRAY['admin']),
('admin_crm_update_ticket', 'admin_crm', 'עדכון פנייה', 'Update ticket', ARRAY['admin']),
('admin_system_health', 'admin_ops', 'בריאות מערכת', 'System health', ARRAY['admin']),
('admin_error_logs', 'admin_ops', 'לוגים של שגיאות', 'Error logs', ARRAY['admin']),
('admin_usage_stats', 'admin_ops', 'סטטיסטיקות שימוש', 'Usage stats', ARRAY['admin']),
-- Bonus tools (role-dependent)
('search_content', 'bonus', 'חיפוש תוכן', 'Search content', ARRAY['student', 'admin']),
('list_modules', 'bonus', 'רשימת מודולים', 'List modules', ARRAY['student', 'admin']),
('view_user_access', 'bonus', 'צפייה בגישות', 'View user access', ARRAY['student', 'admin'])
ON CONFLICT (tool_name) DO NOTHING;