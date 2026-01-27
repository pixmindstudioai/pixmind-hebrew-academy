-- Create discussion groups table
CREATE TABLE public.discussion_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_posting BOOLEAN NOT NULL DEFAULT true,
  access_type TEXT NOT NULL DEFAULT 'restricted' CHECK (access_type IN ('open', 'restricted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group access rules table (for restricted groups)
CREATE TABLE public.group_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.discussion_groups(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT group_access_target_check CHECK (
    (module_id IS NOT NULL AND bundle_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NOT NULL)
  )
);

-- Create group posts table
CREATE TABLE public.group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.discussion_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group comments table
CREATE TABLE public.group_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.group_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_group_access_group ON public.group_access(group_id);
CREATE INDEX idx_group_access_module ON public.group_access(module_id);
CREATE INDEX idx_group_access_bundle ON public.group_access(bundle_id);
CREATE INDEX idx_group_posts_group ON public.group_posts(group_id);
CREATE INDEX idx_group_posts_user ON public.group_posts(user_id);
CREATE INDEX idx_group_comments_post ON public.group_comments(post_id);
CREATE INDEX idx_group_comments_user ON public.group_comments(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_discussion_groups_updated_at
  BEFORE UPDATE ON public.discussion_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_comments_updated_at
  BEFORE UPDATE ON public.group_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.discussion_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_comments ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has access to a group
CREATE OR REPLACE FUNCTION public.user_has_group_access(p_group_id UUID, p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_type TEXT;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get group access type
  SELECT access_type INTO v_access_type
  FROM discussion_groups
  WHERE id = p_group_id AND is_active = true;
  
  -- If group not found or inactive
  IF v_access_type IS NULL THEN
    RETURN false;
  END IF;
  
  -- If open access, allow all authenticated users
  IF v_access_type = 'open' THEN
    RETURN true;
  END IF;
  
  -- Check if user has access via module enrollment
  SELECT EXISTS (
    SELECT 1 FROM group_access ga
    JOIN user_module_access uma ON ga.module_id = uma.module_id
    WHERE ga.group_id = p_group_id
    AND uma.user_email = p_user_email
    AND (uma.expires_at IS NULL OR uma.expires_at > now())
  ) INTO v_has_access;
  
  IF v_has_access THEN
    RETURN true;
  END IF;
  
  -- Check if user has access via bundle enrollment
  SELECT EXISTS (
    SELECT 1 FROM group_access ga
    JOIN user_bundle_access uba ON ga.bundle_id = uba.bundle_id
    WHERE ga.group_id = p_group_id
    AND uba.user_email = p_user_email
    AND (uba.expires_at IS NULL OR uba.expires_at > now())
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- RLS Policies for discussion_groups
CREATE POLICY "Admins can manage groups"
  ON public.discussion_groups
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view accessible groups"
  ON public.discussion_groups
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      access_type = 'open' OR
      public.user_has_group_access(id, (SELECT email FROM users WHERE id = auth.uid()))
    )
  );

-- RLS Policies for group_access
CREATE POLICY "Admins can manage group access"
  ON public.group_access
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view group access for accessible groups"
  ON public.group_access
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_group_access(group_id, (SELECT email FROM users WHERE id = auth.uid()))
  );

-- RLS Policies for group_posts
CREATE POLICY "Admins can manage all posts"
  ON public.group_posts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view posts in accessible groups"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_group_access(group_id, (SELECT email FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create posts in accessible groups with posting enabled"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    public.user_has_group_access(group_id, (SELECT email FROM users WHERE id = auth.uid())) AND
    EXISTS (
      SELECT 1 FROM discussion_groups
      WHERE id = group_id AND allow_posting = true
    )
  );

CREATE POLICY "Users can update own posts"
  ON public.group_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON public.group_posts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for group_comments
CREATE POLICY "Admins can manage all comments"
  ON public.group_comments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view comments on accessible posts"
  ON public.group_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_posts gp
      WHERE gp.id = post_id
      AND public.user_has_group_access(gp.group_id, (SELECT email FROM users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Users can create comments on unlocked posts"
  ON public.group_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN discussion_groups dg ON dg.id = gp.group_id
      WHERE gp.id = post_id
      AND gp.is_locked = false
      AND dg.allow_posting = true
      AND public.user_has_group_access(gp.group_id, (SELECT email FROM users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.group_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.group_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());