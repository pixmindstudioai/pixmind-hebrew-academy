
-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('student', 'admin', 'moderator');
CREATE TYPE content_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo', 'file');
CREATE TYPE embed_type AS ENUM ('link', 'iframe');
CREATE TYPE attachment_kind AS ENUM ('pdf', 'docx', 'xlsx', 'pptx', 'zip', 'image', 'other');
CREATE TYPE moderation_action AS ENUM ('approve', 'hide', 'flag', 'restore');
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'hidden', 'flagged');

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Modules (Courses) table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (LENGTH(title) >= 2 AND LENGTH(title) <= 120),
    description TEXT NOT NULL,
    image_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    status content_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(order_index)
);

-- Chapters table
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 2 AND LENGTH(title) <= 120),
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(module_id, order_index)
);

-- Lessons table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 2 AND LENGTH(title) <= 120),
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    status content_status NOT NULL DEFAULT 'draft',
    -- Video content
    video_provider video_provider,
    video_url TEXT,
    video_id TEXT,
    video_start_time INTEGER DEFAULT 0,
    video_thumbnail TEXT,
    -- Rich text content
    rich_text TEXT,
    -- Duration in seconds
    duration_sec INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(chapter_id, order_index)
);

-- Lesson embeds table
CREATE TABLE public.lesson_embeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    type embed_type NOT NULL,
    title TEXT,
    url TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Lesson attachments table
CREATE TABLE public.lesson_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    mime TEXT NOT NULL,
    size BIGINT NOT NULL CHECK (size >= 0),
    kind attachment_kind NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Comments table with hierarchical structure
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 2000),
    status comment_status NOT NULL DEFAULT 'pending',
    upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
    report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Comment reports for moderation
CREATE TABLE public.comment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, reported_by)
);

-- Moderation actions log
CREATE TABLE public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    moderator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action moderation_action NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Publishing events for audit trail
CREATE TABLE public.publish_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('module', 'chapter', 'lesson')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transcripts for lessons (multilingual support)
CREATE TABLE public.lesson_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    language TEXT NOT NULL DEFAULT 'he',
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, language)
);

-- Admin audit log
CREATE TABLE public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_modules_status ON public.modules(status);
CREATE INDEX idx_modules_order ON public.modules(order_index);
CREATE INDEX idx_modules_created_by ON public.modules(created_by);

CREATE INDEX idx_chapters_module ON public.chapters(module_id);
CREATE INDEX idx_chapters_status ON public.chapters(status);
CREATE INDEX idx_chapters_order ON public.chapters(module_id, order_index);

CREATE INDEX idx_lessons_chapter ON public.lessons(chapter_id);
CREATE INDEX idx_lessons_status ON public.lessons(status);
CREATE INDEX idx_lessons_order ON public.lessons(chapter_id, order_index);

CREATE INDEX idx_lesson_embeds_lesson ON public.lesson_embeds(lesson_id);
CREATE INDEX idx_lesson_attachments_lesson ON public.lesson_attachments(lesson_id);

CREATE INDEX idx_comments_lesson ON public.comments(lesson_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX idx_comments_status ON public.comments(status);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

CREATE INDEX idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_lesson ON public.user_progress(lesson_id);
CREATE INDEX idx_user_progress_completed ON public.user_progress(completed);

CREATE INDEX idx_comment_reports_comment ON public.comment_reports(comment_id);
CREATE INDEX idx_moderation_actions_comment ON public.moderation_actions(comment_id);
CREATE INDEX idx_publish_events_entity ON public.publish_events(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Modules (public read for active content)
CREATE POLICY "Anyone can view active modules" ON public.modules
    FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage all modules" ON public.modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for Chapters
CREATE POLICY "Anyone can view active chapters" ON public.chapters
    FOR SELECT USING (
        status = 'active' AND 
        EXISTS (
            SELECT 1 FROM public.modules m 
            WHERE m.id = module_id AND m.status = 'active'
        )
    );
CREATE POLICY "Admins can manage all chapters" ON public.chapters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for Lessons
CREATE POLICY "Anyone can view active lessons" ON public.lessons
    FOR SELECT USING (
        status = 'active' AND 
        EXISTS (
            SELECT 1 FROM public.chapters c 
            JOIN public.modules m ON c.module_id = m.id
            WHERE c.id = chapter_id AND c.status = 'active' AND m.status = 'active'
        )
    );
CREATE POLICY "Admins can manage all lessons" ON public.lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for Lesson Embeds and Attachments
CREATE POLICY "Anyone can view embeds for active lessons" ON public.lesson_embeds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.chapters c ON l.chapter_id = c.id
            JOIN public.modules m ON c.module_id = m.id
            WHERE l.id = lesson_id AND l.status = 'active' 
            AND c.status = 'active' AND m.status = 'active'
        )
    );

CREATE POLICY "Anyone can view attachments for active lessons" ON public.lesson_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.chapters c ON l.chapter_id = c.id
            JOIN public.modules m ON c.module_id = m.id
            WHERE l.id = lesson_id AND l.status = 'active' 
            AND c.status = 'active' AND m.status = 'active'
        )
    );

-- RLS Policies for Comments
CREATE POLICY "Anyone can view approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Moderators can manage all comments" ON public.comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for User Progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can modify their own progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Comment Reports
CREATE POLICY "Users can create reports" ON public.comment_reports
    FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Moderators can view all reports" ON public.comment_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_transcripts_updated_at BEFORE UPDATE ON public.lesson_transcripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user registration
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

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
