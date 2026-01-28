-- Fix RLS policies for materials tables - use proper security definer function
-- The is_admin() function is already a security definer function, but we need to ensure
-- it's called correctly to avoid infinite recursion

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can manage files" ON public.materials_files;
DROP POLICY IF EXISTS "Admins can manage folder access" ON public.materials_folder_access;

-- 1. materials_folders - separate policies for each operation
CREATE POLICY "Admins can select folders" ON public.materials_folders
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert folders" ON public.materials_folders
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update folders" ON public.materials_folders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete folders" ON public.materials_folders
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 2. materials_files - separate policies
CREATE POLICY "Admins can select files" ON public.materials_files
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert files" ON public.materials_files
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update files" ON public.materials_files
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete files" ON public.materials_files
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. materials_folder_access - separate policies
CREATE POLICY "Admins can select folder access" ON public.materials_folder_access
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert folder access" ON public.materials_folder_access
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update folder access" ON public.materials_folder_access
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete folder access" ON public.materials_folder_access
  FOR DELETE TO authenticated
  USING (public.is_admin());