-- ==============================================
-- FIX BUG #1: Update RLS policies for materials tables
-- Use is_admin_user() which recognizes the placeholder UUID
-- ==============================================

-- Drop existing policies on materials_folders
DROP POLICY IF EXISTS "Admins can select folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can insert folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can update folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can manage folders" ON public.materials_folders;

-- Create new policies for materials_folders
CREATE POLICY "Admins can select folders" ON public.materials_folders
  FOR SELECT TO public
  USING (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can insert folders" ON public.materials_folders
  FOR INSERT TO public
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can update folders" ON public.materials_folders
  FOR UPDATE TO public
  USING (is_admin_user(auth.uid()) OR is_admin())
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can delete folders" ON public.materials_folders
  FOR DELETE TO public
  USING (is_admin_user(auth.uid()) OR is_admin());

-- Drop existing policies on materials_files
DROP POLICY IF EXISTS "Admins can select files" ON public.materials_files;
DROP POLICY IF EXISTS "Admins can insert files" ON public.materials_files;
DROP POLICY IF EXISTS "Admins can update files" ON public.materials_files;
DROP POLICY IF EXISTS "Admins can delete files" ON public.materials_files;
DROP POLICY IF EXISTS "Admins can manage files" ON public.materials_files;

-- Create new policies for materials_files
CREATE POLICY "Admins can select files" ON public.materials_files
  FOR SELECT TO public
  USING (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can insert files" ON public.materials_files
  FOR INSERT TO public
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can update files" ON public.materials_files
  FOR UPDATE TO public
  USING (is_admin_user(auth.uid()) OR is_admin())
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can delete files" ON public.materials_files
  FOR DELETE TO public
  USING (is_admin_user(auth.uid()) OR is_admin());

-- Drop existing policies on materials_folder_access
DROP POLICY IF EXISTS "Admins can select access" ON public.materials_folder_access;
DROP POLICY IF EXISTS "Admins can insert access" ON public.materials_folder_access;
DROP POLICY IF EXISTS "Admins can update access" ON public.materials_folder_access;
DROP POLICY IF EXISTS "Admins can delete access" ON public.materials_folder_access;
DROP POLICY IF EXISTS "Admins can manage access" ON public.materials_folder_access;

-- Create new policies for materials_folder_access
CREATE POLICY "Admins can select access" ON public.materials_folder_access
  FOR SELECT TO public
  USING (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can insert access" ON public.materials_folder_access
  FOR INSERT TO public
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can update access" ON public.materials_folder_access
  FOR UPDATE TO public
  USING (is_admin_user(auth.uid()) OR is_admin())
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

CREATE POLICY "Admins can delete access" ON public.materials_folder_access
  FOR DELETE TO public
  USING (is_admin_user(auth.uid()) OR is_admin());

-- ==============================================
-- FIX BUG #2: Create reorder_chapters RPC function
-- Uses 2-phase update to avoid UNIQUE constraint violations
-- ==============================================

CREATE OR REPLACE FUNCTION public.reorder_chapters(
  p_module_id uuid,
  p_ordered_chapter_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chapter_id uuid;
  v_index int;
BEGIN
  -- Verify admin access
  IF NOT (is_admin_user(auth.uid()) OR is_admin()) THEN
    RAISE EXCEPTION 'Only admins can reorder chapters';
  END IF;

  -- Verify all chapters belong to the specified module
  IF EXISTS (
    SELECT 1 FROM unnest(p_ordered_chapter_ids) AS cid
    WHERE NOT EXISTS (
      SELECT 1 FROM chapters 
      WHERE id = cid AND module_id = p_module_id
    )
  ) THEN
    RAISE EXCEPTION 'All chapter IDs must belong to the specified module';
  END IF;

  -- Phase 1: Assign temporary high order_index values to avoid conflicts
  v_index := 1;
  FOREACH v_chapter_id IN ARRAY p_ordered_chapter_ids
  LOOP
    UPDATE chapters
    SET order_index = 100000 + v_index
    WHERE id = v_chapter_id AND module_id = p_module_id;
    v_index := v_index + 1;
  END LOOP;

  -- Phase 2: Normalize to final values (0-based)
  v_index := 0;
  FOREACH v_chapter_id IN ARRAY p_ordered_chapter_ids
  LOOP
    UPDATE chapters
    SET order_index = v_index
    WHERE id = v_chapter_id AND module_id = p_module_id;
    v_index := v_index + 1;
  END LOOP;
END;
$$;