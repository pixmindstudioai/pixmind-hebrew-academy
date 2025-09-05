-- First, let's check if we need to add CASCADE relationships and RLS policies for delete operations

-- Add missing cascade relationships if they don't exist
DO $$ 
BEGIN
    -- Check if cascade constraint exists for lessons -> chapters
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'lessons' 
        AND kcu.column_name = 'chapter_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        -- Drop existing foreign key if it exists and recreate with CASCADE
        ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_chapter_id_fkey;
        ALTER TABLE public.lessons ADD CONSTRAINT lessons_chapter_id_fkey 
            FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;
    END IF;

    -- Check if cascade constraint exists for chapters -> modules  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'chapters' 
        AND kcu.column_name = 'module_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        -- Drop existing foreign key if it exists and recreate with CASCADE
        ALTER TABLE public.chapters DROP CONSTRAINT IF EXISTS chapters_module_id_fkey;
        ALTER TABLE public.chapters ADD CONSTRAINT chapters_module_id_fkey 
            FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
    END IF;

    -- Add cascade for related tables to lessons
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'user_progress' 
        AND kcu.column_name = 'lesson_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;
        ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_lesson_id_fkey 
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'comments' 
        AND kcu.column_name = 'lesson_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_lesson_id_fkey;
        ALTER TABLE public.comments ADD CONSTRAINT comments_lesson_id_fkey 
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'lesson_ratings' 
        AND kcu.column_name = 'lesson_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE public.lesson_ratings DROP CONSTRAINT IF EXISTS lesson_ratings_lesson_id_fkey;
        ALTER TABLE public.lesson_ratings ADD CONSTRAINT lesson_ratings_lesson_id_fkey 
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'lesson_attachments' 
        AND kcu.column_name = 'lesson_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE public.lesson_attachments DROP CONSTRAINT IF EXISTS lesson_attachments_lesson_id_fkey;
        ALTER TABLE public.lesson_attachments ADD CONSTRAINT lesson_attachments_lesson_id_fkey 
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'lesson_embeds' 
        AND kcu.column_name = 'lesson_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE public.lesson_embeds DROP CONSTRAINT IF EXISTS lesson_embeds_lesson_id_fkey;
        ALTER TABLE public.lesson_embeds ADD CONSTRAINT lesson_embeds_lesson_id_fkey 
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'lesson_transcripts' 
        AND kcu.column_name = 'lesson_id'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE public.lesson_transcripts DROP CONSTRAINT IF EXISTS lesson_transcripts_lesson_id_fkey;
        ALTER TABLE public.lesson_transcripts ADD CONSTRAINT lesson_transcripts_lesson_id_fkey 
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;
END $$;