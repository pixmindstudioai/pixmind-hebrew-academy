-- PixMind Studio Academy Database Schema
-- Complete e-learning platform schema with Hebrew/RTL support

-- Create enums
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('student', 'admin');
CREATE TYPE IF NOT EXISTS content_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE IF NOT EXISTS comment_status AS ENUM ('pending', 'approved', 'hidden', 'flagged');
CREATE TYPE IF NOT EXISTS video_provider AS ENUM ('youtube', 'vimeo', 'file');
CREATE TYPE IF NOT EXISTS embed_type AS ENUM ('link', 'iframe');
CREATE TYPE IF NOT EXISTS attachment_kind AS ENUM ('pdf', 'docx', 'xlsx', 'pptx', 'zip', 'image', 'other');
CREATE TYPE IF NOT EXISTS moderation_action_type AS ENUM ('approve', 'hide', 'flag', 'restore');

-- Create users table (profiles for Supabase Auth integration)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_picture_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  preferences JSONB DEFAULT '{}',
  password_hash TEXT NOT NULL, -- For compatibility
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_chapters_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT,
  video_provider video_provider,
  video_id TEXT,
  video_start_time INTEGER DEFAULT 0,
  video_thumbnail TEXT,
  rich_text TEXT,
  duration_sec INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_lessons_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Create comments table with threading support
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  upvotes INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_comments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create lesson_transcripts table
CREATE TABLE IF NOT EXISTS public.lesson_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  language TEXT NOT NULL DEFAULT 'he',
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_transcripts_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE(lesson_id, language)
);

-- Create lesson_attachments table
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  mime TEXT NOT NULL,
  size BIGINT NOT NULL,
  kind attachment_kind NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_attachments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Create lesson_embeds table
CREATE TABLE IF NOT EXISTS public.lesson_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  type embed_type NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_embeds_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Create comment_reports table for moderation
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_reports_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  moderator_id UUID NOT NULL,
  action moderation_action_type NOT NULL,
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_moderation_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Create publish_events table for scheduling
CREATE TABLE IF NOT EXISTS public.publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_audit_log for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
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

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
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

-- Enable Row Level Security on all tables
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

-- RLS Policies for users table
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

-- RLS Policies for modules table
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

-- RLS Policies for chapters table
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

-- RLS Policies for lessons table
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

-- RLS Policies for comments table
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

-- RLS Policies for user_progress table
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

-- RLS Policies for lesson attachments and embeds (public read for active lessons)
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

-- RLS Policies for comment reports
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

-- Create function to handle new user registration via Auth trigger
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();