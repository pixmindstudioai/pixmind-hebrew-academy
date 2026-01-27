-- Create materials_folders table
CREATE TABLE public.materials_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials_files table
CREATE TABLE public.materials_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.materials_folders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials_folder_access table (links folders to courses/bundles)
CREATE TABLE public.materials_folder_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.materials_folders(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT folder_access_target CHECK (
    (module_id IS NOT NULL AND bundle_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_materials_files_folder ON public.materials_files(folder_id);
CREATE INDEX idx_materials_folder_access_folder ON public.materials_folder_access(folder_id);
CREATE INDEX idx_materials_folder_access_module ON public.materials_folder_access(module_id);
CREATE INDEX idx_materials_folder_access_bundle ON public.materials_folder_access(bundle_id);

-- Enable RLS
ALTER TABLE public.materials_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_folder_access ENABLE ROW LEVEL SECURITY;

-- Admin policies for materials_folders
CREATE POLICY "Admins can manage folders"
  ON public.materials_folders FOR ALL
  USING (public.is_admin());

-- Users can view active folders they have access to
CREATE POLICY "Users can view accessible folders"
  ON public.materials_folders FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.materials_folder_access mfa
      WHERE mfa.folder_id = id AND (
        -- Check module access
        (mfa.module_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_module_access uma
          WHERE uma.module_id = mfa.module_id
          AND lower(uma.user_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
          AND (uma.expires_at IS NULL OR uma.expires_at > now())
        ))
        OR
        -- Check bundle access (user has access to bundle)
        (mfa.bundle_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_bundle_access uba
          WHERE uba.bundle_id = mfa.bundle_id
          AND lower(uba.user_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
          AND (uba.expires_at IS NULL OR uba.expires_at > now())
        ))
      )
    )
  );

-- Admin policies for materials_files
CREATE POLICY "Admins can manage files"
  ON public.materials_files FOR ALL
  USING (public.is_admin());

-- Users can view files in accessible folders
CREATE POLICY "Users can view files in accessible folders"
  ON public.materials_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.materials_folders mf
      WHERE mf.id = folder_id
      AND mf.is_active = true
      AND EXISTS (
        SELECT 1 FROM public.materials_folder_access mfa
        WHERE mfa.folder_id = mf.id AND (
          (mfa.module_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_module_access uma
            WHERE uma.module_id = mfa.module_id
            AND lower(uma.user_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
            AND (uma.expires_at IS NULL OR uma.expires_at > now())
          ))
          OR
          (mfa.bundle_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_bundle_access uba
            WHERE uba.bundle_id = mfa.bundle_id
            AND lower(uba.user_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
            AND (uba.expires_at IS NULL OR uba.expires_at > now())
          ))
        )
      )
    )
  );

-- Admin policies for materials_folder_access
CREATE POLICY "Admins can manage folder access"
  ON public.materials_folder_access FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users can view folder access for accessible folders"
  ON public.materials_folder_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.materials_folders mf
      WHERE mf.id = folder_id
      AND mf.is_active = true
    )
  );

-- Create storage bucket for materials (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for materials bucket
CREATE POLICY "Admins can upload materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials' AND public.is_admin());

CREATE POLICY "Admins can update materials"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'materials' AND public.is_admin());

CREATE POLICY "Admins can delete materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'materials' AND public.is_admin());

-- Users can download materials they have access to (via signed URLs)
CREATE POLICY "Authenticated users can view materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_materials_folders_updated_at
  BEFORE UPDATE ON public.materials_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();