-- Add policy to allow enrolled users to view hidden courses they have access to
CREATE POLICY "Enrolled users can view their hidden modules"
ON public.modules
FOR SELECT
USING (
  is_hidden = true 
  AND EXISTS (
    SELECT 1 FROM public.user_module_access uma
    WHERE uma.module_id = modules.id
    AND uma.user_email = lower(auth.email())
    AND (uma.expires_at IS NULL OR uma.expires_at > now())
  )
);

-- Ensure the public policy allows viewing active non-hidden modules
-- This was already created in the previous migration