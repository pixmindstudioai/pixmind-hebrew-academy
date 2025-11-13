-- Add missing fields to users table for student management
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
ADD COLUMN IF NOT EXISTS device_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC);

-- Function to update last login
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger to update last login on auth
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_user_last_login();

-- Create activity log table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('login', 'lesson_completed', 'module_enrolled', 'profile_updated')),
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity log
CREATE POLICY "Users can view their own activity" 
ON public.user_activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" 
ON public.user_activity_log 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can insert activity" 
ON public.user_activity_log 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON public.user_activity_log(action_type);

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_action_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, action_type, action_details)
  VALUES (p_user_id, p_action_type, p_action_details);
END;
$$;

-- Update RLS policies on users table to allow admins to update status
CREATE POLICY "Admins can update user status" 
ON public.users 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Function to reset user progress for a module
CREATE OR REPLACE FUNCTION public.reset_user_module_progress(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reset user progress';
  END IF;

  -- Delete all progress for lessons in this module
  DELETE FROM public.user_progress
  WHERE user_id = p_user_id
  AND lesson_id IN (
    SELECT l.id 
    FROM lessons l
    JOIN chapters c ON l.chapter_id = c.id
    WHERE c.module_id = p_module_id
  );

  -- Log the action
  PERFORM log_user_activity(
    p_user_id,
    'profile_updated',
    jsonb_build_object('action', 'progress_reset', 'module_id', p_module_id)
  );
END;
$$;

-- Function to block/unblock user
CREATE OR REPLACE FUNCTION public.update_user_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;

  -- Update user status
  UPDATE public.users
  SET status = p_status
  WHERE id = p_user_id;

  -- Log the action
  PERFORM log_user_activity(
    p_user_id,
    'profile_updated',
    jsonb_build_object('action', 'status_changed', 'new_status', p_status)
  );
END;
$$;
