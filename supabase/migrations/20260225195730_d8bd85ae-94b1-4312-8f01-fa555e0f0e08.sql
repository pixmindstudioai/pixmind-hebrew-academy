-- Add cohort_id to calendar_event_visibility
ALTER TABLE public.calendar_event_visibility
ADD COLUMN cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE;

-- Update the user_can_view_calendar_event function to also check cohort membership
CREATE OR REPLACE FUNCTION public.user_can_view_calendar_event(p_event_id uuid, p_user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_access_type TEXT;
  v_is_active BOOLEAN;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get event details
  SELECT access_type, is_active 
  INTO v_access_type, v_is_active
  FROM calendar_events
  WHERE id = p_event_id;
  
  -- Check if event exists and is active
  IF v_access_type IS NULL OR v_is_active = false THEN
    RETURN false;
  END IF;
  
  -- If open to all, allow access
  IF v_access_type = 'all' THEN
    RETURN true;
  END IF;
  
  -- Check module enrollment
  SELECT EXISTS (
    SELECT 1 FROM calendar_event_visibility cev
    JOIN user_module_access uma ON cev.module_id = uma.module_id
    WHERE cev.event_id = p_event_id
    AND cev.module_id IS NOT NULL
    AND uma.user_email = p_user_email
    AND (uma.expires_at IS NULL OR uma.expires_at > now())
  ) INTO v_has_access;
  
  IF v_has_access THEN
    RETURN true;
  END IF;
  
  -- Check bundle enrollment
  SELECT EXISTS (
    SELECT 1 FROM calendar_event_visibility cev
    JOIN user_bundle_access uba ON cev.bundle_id = uba.bundle_id
    WHERE cev.event_id = p_event_id
    AND cev.bundle_id IS NOT NULL
    AND uba.user_email = p_user_email
    AND (uba.expires_at IS NULL OR uba.expires_at > now())
  ) INTO v_has_access;
  
  IF v_has_access THEN
    RETURN true;
  END IF;

  -- Check cohort (cycle) membership
  SELECT EXISTS (
    SELECT 1 FROM calendar_event_visibility cev
    JOIN cohort_students cs ON cev.cohort_id = cs.cohort_id
    WHERE cev.event_id = p_event_id
    AND cev.cohort_id IS NOT NULL
    AND lower(cs.email) = lower(p_user_email)
    AND cs.status = 'active'
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$function$;