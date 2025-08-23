-- PixMind Studio Academy Database Schema
-- Complete e-learning platform schema with Hebrew/RTL support

-- Create enums (handle existence manually)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('draft', 'active', 'archived');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_status') THEN
        CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'hidden', 'flagged');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_provider') THEN
        CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo', 'file');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'embed_type') THEN
        CREATE TYPE embed_type AS ENUM ('link', 'iframe');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_kind') THEN
        CREATE TYPE attachment_kind AS ENUM ('pdf', 'docx', 'xlsx', 'pptx', 'zip', 'image', 'other');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action_type') THEN
        CREATE TYPE moderation_action_type AS ENUM ('approve', 'hide', 'flag', 'restore');
    END IF;
END
$$;

-- Ensure all necessary indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(order_index);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_created_by ON modules(created_by);

CREATE INDEX IF NOT EXISTS idx_chapters_module ON chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);

CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);

CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_transcripts_lesson ON lesson_transcripts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_language ON lesson_transcripts(language);

CREATE INDEX IF NOT EXISTS idx_attachments_lesson ON lesson_attachments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attachments_order ON lesson_attachments(lesson_id, order_index);

CREATE INDEX IF NOT EXISTS idx_embeds_lesson ON lesson_embeds(lesson_id);
CREATE INDEX IF NOT EXISTS idx_embeds_order ON lesson_embeds(lesson_id, order_index);

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure all triggers are created for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON public.chapters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transcripts_updated_at ON public.lesson_transcripts;
CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON public.lesson_transcripts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Ensure proper RLS policies exist for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Ensure proper RLS policies for modules table
DROP POLICY IF EXISTS "Anyone can view active modules" ON public.modules;
CREATE POLICY "Anyone can view active modules" 
ON public.modules 
FOR SELECT 
USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;
CREATE POLICY "Admins can manage all modules" 
ON public.modules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Ensure proper RLS policies for chapters table
DROP POLICY IF EXISTS "Anyone can view active chapters" ON public.chapters;
CREATE POLICY "Anyone can view active chapters" 
ON public.chapters 
FOR SELECT 
USING (status = 'active' AND EXISTS (
  SELECT 1 FROM modules m 
  WHERE m.id = chapters.module_id AND m.status = 'active'
));

DROP POLICY IF EXISTS "Admins can manage all chapters" ON public.chapters;
CREATE POLICY "Admins can manage all chapters" 
ON public.chapters 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Ensure proper RLS policies for lessons table
DROP POLICY IF EXISTS "Anyone can view active lessons" ON public.lessons;
CREATE POLICY "Anyone can view active lessons" 
ON public.lessons 
FOR SELECT 
USING (status = 'active' AND EXISTS (
  SELECT 1 FROM chapters c 
  JOIN modules m ON c.module_id = m.id 
  WHERE c.id = lessons.chapter_id 
    AND c.status = 'active' 
    AND m.status = 'active'
));

DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Admins can manage all lessons" 
ON public.lessons 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Ensure proper RLS policies for comments table
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.comments;
CREATE POLICY "Anyone can view approved comments" 
ON public.comments 
FOR SELECT 
USING (status = 'approved');

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Moderators can manage all comments" ON public.comments;
CREATE POLICY "Moderators can manage all comments" 
ON public.comments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Ensure proper RLS policies for user_progress table
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can modify their own progress" ON public.user_progress;
CREATE POLICY "Users can modify their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Ensure proper RLS policies for lesson attachments and embeds
DROP POLICY IF EXISTS "Anyone can view attachments for active lessons" ON public.lesson_attachments;
CREATE POLICY "Anyone can view attachments for active lessons" 
ON public.lesson_attachments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM lessons l 
  JOIN chapters c ON l.chapter_id = c.id 
  JOIN modules m ON c.module_id = m.id 
  WHERE l.id = lesson_attachments.lesson_id 
    AND l.status = 'active' 
    AND c.status = 'active' 
    AND m.status = 'active'
));

DROP POLICY IF EXISTS "Anyone can view embeds for active lessons" ON public.lesson_embeds;
CREATE POLICY "Anyone can view embeds for active lessons" 
ON public.lesson_embeds 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM lessons l 
  JOIN chapters c ON l.chapter_id = c.id 
  JOIN modules m ON c.module_id = m.id 
  WHERE l.id = lesson_embeds.lesson_id 
    AND l.status = 'active' 
    AND c.status = 'active' 
    AND m.status = 'active'
));

-- Ensure proper RLS policies for comment reports
DROP POLICY IF EXISTS "Users can create reports" ON public.comment_reports;
CREATE POLICY "Users can create reports" 
ON public.comment_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Moderators can view all reports" ON public.comment_reports;
CREATE POLICY "Moderators can view all reports" 
ON public.comment_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- Ensure trigger for new user registration exists and is updated
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the auth trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();