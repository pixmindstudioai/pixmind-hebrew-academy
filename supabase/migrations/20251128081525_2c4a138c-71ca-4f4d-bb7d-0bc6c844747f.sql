-- Security Fix: Implement proper role-based access control and strengthen RLS policies

-- Step 1: Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing roles from users table to user_roles table
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT id, role, created_at
FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Create security definer function for role checking (replaces is_admin)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 4: Update is_admin function to use new role structure
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Step 5: Update is_admin_user function to use new role structure
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (user_id = '00000000-0000-0000-0000-000000000000'::uuid) OR 
         public.has_role(user_id, 'admin');
$$;

-- Step 6: Create policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 7: Drop redundant RLS policies on users table and create consolidated ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "read_own_user_row" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "update_own_profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update user status" ON public.users;

-- Create new consolidated policies that prevent enumeration
CREATE POLICY "authenticated_users_select_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "authenticated_users_update_own_profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admins_select_all_users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_all_users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 8: Add comment explaining the security model
COMMENT ON TABLE public.users IS 'User profiles table. RLS policies ensure authenticated users can only access their own profile unless they have admin role. This prevents enumeration attacks.';
COMMENT ON TABLE public.user_roles IS 'User roles table. Roles are stored separately from user profiles to prevent privilege escalation attacks.';

-- Step 9: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);