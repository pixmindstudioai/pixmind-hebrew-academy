-- Security Fix: Prevent user_id exposure in public comments
-- Create secure view that only exposes necessary public information

-- Step 1: Update RLS policies to restrict direct table access
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.comments;

-- Only authenticated users and admins can query the comments table directly
CREATE POLICY "authenticated_users_view_approved_comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "admins_view_all_comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 2: Create secure view for public comment display (no user_id exposure)
CREATE OR REPLACE VIEW public.lesson_comments_public
WITH (security_invoker = on) AS
SELECT 
  c.id,
  c.lesson_id,
  c.content,
  c.created_at,
  c.upvotes,
  c.parent_comment_id,
  -- Only expose the user's display name, not their ID or email
  u.full_name as user_name
FROM public.comments c
JOIN public.users u ON c.user_id = u.id
WHERE c.status = 'approved';

-- Grant public read access to the view
GRANT SELECT ON public.lesson_comments_public TO authenticated, anon;

-- Step 3: Add security documentation
COMMENT ON VIEW public.lesson_comments_public IS 'Public view of approved lesson comments. Uses SECURITY INVOKER to respect RLS. Only exposes user display names without user_id for privacy protection.';
COMMENT ON TABLE public.comments IS 'Comments table. Direct access restricted to authenticated users and admins. Use lesson_comments_public view for public comment display to protect user privacy.';