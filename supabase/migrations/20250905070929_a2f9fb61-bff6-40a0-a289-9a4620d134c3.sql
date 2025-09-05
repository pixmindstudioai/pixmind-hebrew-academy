-- Clean up orphaned records before adding cascade constraints
-- This will remove any data that references non-existent lessons

-- Clean up orphaned lesson_ratings
DELETE FROM public.lesson_ratings 
WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Clean up orphaned comments
DELETE FROM public.comments 
WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Clean up orphaned user_progress
DELETE FROM public.user_progress 
WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Clean up orphaned lesson_attachments  
DELETE FROM public.lesson_attachments 
WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Clean up orphaned lesson_embeds
DELETE FROM public.lesson_embeds 
WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Clean up orphaned lesson_transcripts
DELETE FROM public.lesson_transcripts 
WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Clean up orphaned lessons that point to non-existent chapters
DELETE FROM public.lessons 
WHERE chapter_id NOT IN (SELECT id FROM public.chapters);

-- Clean up orphaned chapters that point to non-existent modules
DELETE FROM public.chapters 
WHERE module_id NOT IN (SELECT id FROM public.modules);

-- Now add the proper cascade constraints
-- Drop existing foreign keys and recreate with CASCADE

-- Lessons -> Chapters cascade
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_chapter_id_fkey;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_chapter_id_fkey 
    FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;

-- Chapters -> Modules cascade  
ALTER TABLE public.chapters DROP CONSTRAINT IF EXISTS chapters_module_id_fkey;
ALTER TABLE public.chapters ADD CONSTRAINT chapters_module_id_fkey 
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- All lesson-related tables cascade on lesson deletion
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_lesson_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_ratings DROP CONSTRAINT IF EXISTS lesson_ratings_lesson_id_fkey;
ALTER TABLE public.lesson_ratings ADD CONSTRAINT lesson_ratings_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_attachments DROP CONSTRAINT IF EXISTS lesson_attachments_lesson_id_fkey;
ALTER TABLE public.lesson_attachments ADD CONSTRAINT lesson_attachments_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_embeds DROP CONSTRAINT IF EXISTS lesson_embeds_lesson_id_fkey;
ALTER TABLE public.lesson_embeds ADD CONSTRAINT lesson_embeds_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_transcripts DROP CONSTRAINT IF EXISTS lesson_transcripts_lesson_id_fkey;
ALTER TABLE public.lesson_transcripts ADD CONSTRAINT lesson_transcripts_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;