-- Add thumbnail columns for modules and lessons
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Add unique constraint for user progress (with proper syntax)
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

-- Update RLS policy for progress to allow upsert operations
DROP POLICY IF EXISTS "upsert_own_progress" ON public.user_progress;
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

-- Create storage policies for thumbnails
CREATE POLICY "Anyone can view thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);