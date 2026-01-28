-- Fix RLS policies for materials tables
-- Problem: Missing WITH CHECK clause prevents INSERT operations

-- 1. materials_folders
DROP POLICY IF EXISTS "Admins can manage folders" ON public.materials_folders;
CREATE POLICY "Admins can manage folders" ON public.materials_folders
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. materials_files
DROP POLICY IF EXISTS "Admins can manage files" ON public.materials_files;
CREATE POLICY "Admins can manage files" ON public.materials_files
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. materials_folder_access
DROP POLICY IF EXISTS "Admins can manage folder access" ON public.materials_folder_access;
CREATE POLICY "Admins can manage folder access" ON public.materials_folder_access
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());