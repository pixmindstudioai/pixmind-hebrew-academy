-- Drop the broken policies
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.task_submissions;

-- Create fixed policies using auth.email() instead of subquery to auth.users
CREATE POLICY "Users can view their own submissions"
ON public.task_submissions
FOR SELECT
USING (
  lower(user_email) = lower(auth.email()) 
  OR is_admin()
);

CREATE POLICY "Users can create their own submissions"
ON public.task_submissions
FOR INSERT
WITH CHECK (
  lower(user_email) = lower(auth.email())
);