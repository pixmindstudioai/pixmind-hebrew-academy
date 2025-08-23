-- Add foreign key constraint for lessons.chapter_id -> chapters.id
-- The column already exists but is missing the foreign key relationship

ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_chapter_id_fkey 
FOREIGN KEY (chapter_id) 
REFERENCES public.chapters(id) 
ON DELETE CASCADE;