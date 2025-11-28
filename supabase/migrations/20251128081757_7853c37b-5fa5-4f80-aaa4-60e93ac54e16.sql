-- Remove the view that caused security warning
DROP VIEW IF EXISTS public.user_profiles_safe;

-- The password_hash column has already been dropped
-- The remaining user table structure is now secure:
-- - Authenticated users can only SELECT their own profile (id = auth.uid())
-- - Admins can SELECT all profiles via has_role check
-- - No sensitive columns like password_hash remain
-- - Email, full_name, profile_picture_url are necessary for app functionality

-- Add additional security comment
COMMENT ON TABLE public.users IS 'User profiles table. RLS policies ensure authenticated users can only access their own profile unless they have admin role. Password hashes are managed by Supabase Auth in auth.users, not here. This prevents enumeration attacks and unauthorized data access.';