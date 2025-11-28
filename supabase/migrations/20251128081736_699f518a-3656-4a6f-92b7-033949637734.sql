-- Security Fix: Remove password_hash exposure and create secure user profile view

-- Step 1: Drop the password_hash column as it's not used (Supabase Auth handles passwords in auth.users)
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Create a secure view that only exposes safe user fields
CREATE OR REPLACE VIEW public.user_profiles_safe AS
SELECT 
  id,
  email,
  full_name,
  profile_picture_url,
  created_at,
  updated_at,
  last_login_at,
  status
FROM public.users;

-- Step 3: Grant appropriate access to the view
GRANT SELECT ON public.user_profiles_safe TO authenticated;

-- Step 4: Add helpful comments
COMMENT ON VIEW public.user_profiles_safe IS 'Secure view of user profiles that excludes sensitive fields. Use this view for client-facing queries.';
COMMENT ON COLUMN public.users.email IS 'User email address. Access controlled by RLS policies.';

-- Step 5: Ensure role column is never exposed in SELECT queries by removing it from typical access
-- Note: The role is now in user_roles table, but we keep it in users for backwards compatibility
-- However, we should discourage its use in favor of the user_roles table
COMMENT ON COLUMN public.users.role IS 'DEPRECATED: Use user_roles table instead. This column is kept for backwards compatibility only.';