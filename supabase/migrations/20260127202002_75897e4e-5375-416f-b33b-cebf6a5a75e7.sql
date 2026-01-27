-- Create event type enum
CREATE TYPE public.event_type AS ENUM ('live_lesson', 'deadline', 'meeting', 'broadcast', 'other');

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'other',
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  location TEXT,
  external_link TEXT,
  attachment_url TEXT,
  access_type TEXT NOT NULL DEFAULT 'all' CHECK (access_type IN ('all', 'restricted')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_event_visibility table for restricted access
CREATE TABLE public.calendar_event_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_one_target CHECK (
    (module_id IS NOT NULL AND bundle_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_calendar_events_start ON public.calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_active ON public.calendar_events(is_active);
CREATE INDEX idx_calendar_event_visibility_event ON public.calendar_event_visibility(event_id);
CREATE INDEX idx_calendar_event_visibility_module ON public.calendar_event_visibility(module_id);
CREATE INDEX idx_calendar_event_visibility_bundle ON public.calendar_event_visibility(bundle_id);

-- Create function to check if user can view an event
CREATE OR REPLACE FUNCTION public.user_can_view_calendar_event(p_event_id UUID, p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND uba.user_email = p_user_email
    AND (uba.expires_at IS NULL OR uba.expires_at > now())
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_visibility ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_events
CREATE POLICY "Admins can manage calendar events"
ON public.calendar_events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view permitted active events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  is_active = true AND
  public.user_can_view_calendar_event(id, (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- RLS policies for calendar_event_visibility
CREATE POLICY "Admins can manage event visibility"
ON public.calendar_event_visibility
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view visibility for permitted events"
ON public.calendar_event_visibility
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.id = event_id
    AND ce.is_active = true
    AND public.user_can_view_calendar_event(ce.id, (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();