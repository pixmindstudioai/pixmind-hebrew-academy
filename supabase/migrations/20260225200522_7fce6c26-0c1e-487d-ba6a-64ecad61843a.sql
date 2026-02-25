
-- Fix calendar_events RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view permitted active events" ON public.calendar_events;

-- Recreate admin policy with placeholder UUID support
CREATE POLICY "Admins can manage calendar events"
ON public.calendar_events
FOR ALL
TO public
USING (is_admin_user(auth.uid()) OR is_admin())
WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

-- Recreate user SELECT policy using auth.email() instead of subquerying auth.users
CREATE POLICY "Users can view permitted active events"
ON public.calendar_events
FOR SELECT
TO public
USING (
  is_active = true 
  AND user_can_view_calendar_event(id, COALESCE(auth.email(), '')::text)
);

-- Fix calendar_event_visibility RLS policies
DROP POLICY IF EXISTS "Admins can manage event visibility" ON public.calendar_event_visibility;
DROP POLICY IF EXISTS "Users can view visibility for permitted events" ON public.calendar_event_visibility;

-- Recreate admin policy with placeholder UUID support
CREATE POLICY "Admins can manage event visibility"
ON public.calendar_event_visibility
FOR ALL
TO public
USING (is_admin_user(auth.uid()) OR is_admin())
WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

-- Recreate user SELECT policy using auth.email()
CREATE POLICY "Users can view visibility for permitted events"
ON public.calendar_event_visibility
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.id = calendar_event_visibility.event_id
    AND ce.is_active = true
    AND user_can_view_calendar_event(ce.id, COALESCE(auth.email(), '')::text)
  )
);
