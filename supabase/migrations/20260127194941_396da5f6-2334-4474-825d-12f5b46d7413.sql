-- Add lesson_type column to lessons table
-- Default to 'text' for backward compatibility with existing lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'text';

-- Add images JSONB column for storing image data (URLs, captions, order)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.lessons.lesson_type IS 'Type of lesson: text, text_with_images, or video';
COMMENT ON COLUMN public.lessons.images IS 'Array of image objects with url, caption, and order for text_with_images lessons';

-- Update existing lessons that have video_url to be video type
UPDATE public.lessons 
SET lesson_type = 'video' 
WHERE video_url IS NOT NULL AND video_url != '';

-- Create index for filtering by lesson type
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_type ON public.lessons(lesson_type);