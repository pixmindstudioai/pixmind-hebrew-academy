-- Part A: Users table and admin helpers

-- Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email normalization trigger
CREATE OR REPLACE FUNCTION public.normalize_user_email()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_normalize_user_email ON public.users;
CREATE TRIGGER trg_normalize_user_email
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.normalize_user_email();

-- Auth user sync trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    lower(NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  );
$$;

-- Secure admin elevation function
CREATE OR REPLACE FUNCTION public.set_current_user_admin(secret_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF secret_code = 'pixmind2025' THEN
    UPDATE public.users SET role = 'admin' WHERE id = auth.uid();
    RETURN true;
  END IF;
  RETURN false;
END $$;

-- RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_user_row" ON public.users;
CREATE POLICY "read_own_user_row"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON public.users;
CREATE POLICY "update_own_profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Part B: Fix user_module_access RLS
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_access_by_email" ON public.user_module_access;
DROP POLICY IF EXISTS "admin_manage_access_all" ON public.user_module_access;

CREATE POLICY "read_own_access_by_email"
ON public.user_module_access FOR SELECT
TO authenticated
USING (lower(user_email) = lower(auth.email()));

CREATE POLICY "admin_manage_access_all"
ON public.user_module_access FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());