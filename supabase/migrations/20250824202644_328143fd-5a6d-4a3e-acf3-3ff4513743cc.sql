-- Add missing columns for links, attachments, thumbnails, and verification
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS links jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS attachments jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create attachments storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for attachments
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

CREATE POLICY "Anyone can view attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can upload attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

-- Fix foreign keys with CASCADE deletion
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_chapter_id_fkey;
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_chapter_id_fkey
  FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_lesson_id_fkey;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_lesson_id_fkey
  FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.user_progress
  DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;
ALTER TABLE public.user_progress
  ADD CONSTRAINT user_progress_lesson_id_fkey
  FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Ensure unique constraint exists for user progress
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_progress_user_id_lesson_id_key' 
        AND table_name = 'user_progress'
    ) THEN
        ALTER TABLE public.user_progress 
        ADD CONSTRAINT user_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
    END IF;
END $$;

-- Update RLS policies for user progress
DROP POLICY IF EXISTS "upsert_own_progress" ON public.user_progress;
CREATE POLICY "upsert_own_progress"
ON public.user_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin-only mutations for chapters and lessons
DROP POLICY IF EXISTS "admin_chapters_mutate" ON public.chapters;
CREATE POLICY "admin_chapters_mutate"
ON public.chapters
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_lessons_mutate" ON public.lessons;
CREATE POLICY "admin_lessons_mutate"
ON public.lessons
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());