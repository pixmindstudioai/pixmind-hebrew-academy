-- Fix security warnings from the linter

-- Fix function search path issues by setting secure search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Ensure RLS is enabled on publish_events and admin_audit_log tables
ALTER TABLE public.publish_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for publish_events table
DROP POLICY IF EXISTS "Admins can manage publish events" ON public.publish_events;
CREATE POLICY "Admins can manage publish events" 
ON public.publish_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Add missing RLS policies for admin_audit_log table  
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true); -- Allow system to insert audit logs

-- Add missing RLS policies for moderation_actions table
DROP POLICY IF EXISTS "Moderators can manage actions" ON public.moderation_actions;
CREATE POLICY "Moderators can manage actions" 
ON public.moderation_actions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Add missing RLS policies for lesson_transcripts table
DROP POLICY IF EXISTS "Anyone can view transcripts for active lessons" ON public.lesson_transcripts;
CREATE POLICY "Anyone can view transcripts for active lessons" 
ON public.lesson_transcripts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM lessons l 
  JOIN chapters c ON l.chapter_id = c.id 
  JOIN modules m ON c.module_id = m.id 
  WHERE l.id = lesson_transcripts.lesson_id 
    AND l.status = 'active' 
    AND c.status = 'active' 
    AND m.status = 'active'
));

-- Add admin policies for managing transcripts
DROP POLICY IF EXISTS "Admins can manage transcripts" ON public.lesson_transcripts;
CREATE POLICY "Admins can manage transcripts" 
ON public.lesson_transcripts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Add admin policies for managing attachments
DROP POLICY IF EXISTS "Admins can manage attachments" ON public.lesson_attachments;
CREATE POLICY "Admins can manage attachments" 
ON public.lesson_attachments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Add admin policies for managing embeds
DROP POLICY IF EXISTS "Admins can manage embeds" ON public.lesson_embeds;
CREATE POLICY "Admins can manage embeds" 
ON public.lesson_embeds 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Ensure all tables that should be protected are protected
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.chapters TO authenticated; 
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.comments TO authenticated;
GRANT SELECT ON public.lesson_attachments TO authenticated;
GRANT SELECT ON public.lesson_embeds TO authenticated;
GRANT SELECT ON public.lesson_transcripts TO authenticated;
GRANT INSERT ON public.comment_reports TO authenticated;

-- Grant admin permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;