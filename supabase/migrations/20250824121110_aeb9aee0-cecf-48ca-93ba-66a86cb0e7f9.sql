-- Add thumbnail columns to modules and lessons tables (idempotent)
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Ensure unique key for progress to prevent duplicate key errors
ALTER TABLE public.user_progress
  ADD CONSTRAINT IF NOT EXISTS user_progress_user_id_lesson_id_key
  UNIQUE (user_id, lesson_id);

-- Update RLS policy for user_progress to allow upserts
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can modify their own progress" ON public.user_progress;

-- Create comprehensive policy for all operations on user_progress
CREATE POLICY "upsert_own_progress"
ON public.user_progress
FOR ALL
TO authenticated
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );

-- Create thumbnails storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for thumbnails bucket
CREATE POLICY "Public can view thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);