-- Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'::user_role
  );
$$;

-- Clean up old policies on user_module_access
DROP POLICY IF EXISTS "Users can read own access by email" ON public.user_module_access;
DROP POLICY IF EXISTS "Admins can manage all access" ON public.user_module_access;
DROP POLICY IF EXISTS "read_own_access_by_email" ON public.user_module_access;
DROP POLICY IF EXISTS "admin_manage_access" ON public.user_module_access;

-- Create new strict RLS policies
-- Policy 1: Users can read only their own access records by email
CREATE POLICY "read_own_access_by_email"
ON public.user_module_access
FOR SELECT
TO authenticated
USING (lower(user_email) = lower((auth.jwt() -> 'email')::text));

-- Policy 2: Only admins can insert/update/delete (and also select all if needed)
CREATE POLICY "admin_manage_access_all"
ON public.user_module_access
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create email normalization function
CREATE OR REPLACE FUNCTION public.normalize_user_module_access_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.user_email := lower(trim(NEW.user_email));
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_normalize_uma_email ON public.user_module_access;

-- Create trigger for email normalization
CREATE TRIGGER trg_normalize_uma_email
BEFORE INSERT OR UPDATE ON public.user_module_access
FOR EACH ROW EXECUTE FUNCTION public.normalize_user_module_access_email();