-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  access_type TEXT NOT NULL DEFAULT 'all' CHECK (access_type IN ('all', 'restricted')),
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expire_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcement visibility rules table
CREATE TABLE public.announcement_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT announcement_visibility_target_check CHECK (
    (module_id IS NOT NULL AND bundle_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_announcements_active ON public.announcements(is_active, publish_date);
CREATE INDEX idx_announcements_pinned ON public.announcements(is_pinned);
CREATE INDEX idx_announcement_visibility_announcement ON public.announcement_visibility(announcement_id);
CREATE INDEX idx_announcement_visibility_module ON public.announcement_visibility(module_id);
CREATE INDEX idx_announcement_visibility_bundle ON public.announcement_visibility(bundle_id);

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_visibility ENABLE ROW LEVEL SECURITY;

-- Create function to check if user can see announcement
CREATE OR REPLACE FUNCTION public.user_can_view_announcement(p_announcement_id UUID, p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_type TEXT;
  v_is_active BOOLEAN;
  v_publish_date TIMESTAMPTZ;
  v_expire_date TIMESTAMPTZ;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get announcement details
  SELECT access_type, is_active, publish_date, expire_date 
  INTO v_access_type, v_is_active, v_publish_date, v_expire_date
  FROM announcements
  WHERE id = p_announcement_id;
  
  -- Check if announcement exists and is active
  IF v_access_type IS NULL OR v_is_active = false THEN
    RETURN false;
  END IF;
  
  -- Check publish date
  IF v_publish_date > now() THEN
    RETURN false;
  END IF;
  
  -- Check expiration date
  IF v_expire_date IS NOT NULL AND v_expire_date < now() THEN
    RETURN false;
  END IF;
  
  -- If open to all, allow access
  IF v_access_type = 'all' THEN
    RETURN true;
  END IF;
  
  -- Check module enrollment
  SELECT EXISTS (
    SELECT 1 FROM announcement_visibility av
    JOIN user_module_access uma ON av.module_id = uma.module_id
    WHERE av.announcement_id = p_announcement_id
    AND uma.user_email = p_user_email
    AND (uma.expires_at IS NULL OR uma.expires_at > now())
  ) INTO v_has_access;
  
  IF v_has_access THEN
    RETURN true;
  END IF;
  
  -- Check bundle enrollment
  SELECT EXISTS (
    SELECT 1 FROM announcement_visibility av
    JOIN user_bundle_access uba ON av.bundle_id = uba.bundle_id
    WHERE av.announcement_id = p_announcement_id
    AND uba.user_email = p_user_email
    AND (uba.expires_at IS NULL OR uba.expires_at > now())
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- RLS Policies for announcements
CREATE POLICY "Admins can manage announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view accessible announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND publish_date <= now()
    AND (expire_date IS NULL OR expire_date > now())
    AND (
      access_type = 'all' OR
      public.user_can_view_announcement(id, (SELECT email FROM users WHERE id = auth.uid()))
    )
  );

-- RLS Policies for announcement_visibility
CREATE POLICY "Admins can manage announcement visibility"
  ON public.announcement_visibility
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view visibility for accessible announcements"
  ON public.announcement_visibility
  FOR SELECT
  TO authenticated
  USING (
    public.user_can_view_announcement(announcement_id, (SELECT email FROM users WHERE id = auth.uid()))
  );