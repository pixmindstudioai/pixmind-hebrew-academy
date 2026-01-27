-- Create user_notebooks table
CREATE TABLE public.user_notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'מחברת חדשה',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notebook_entries table
CREATE TABLE public.notebook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.user_notebooks(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  lesson_title TEXT NOT NULL,
  video_url TEXT,
  video_timestamp INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notebook_messages table for conversation history
CREATE TABLE public.notebook_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.notebook_entries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notebooks
CREATE POLICY "Users can view their own notebooks"
  ON public.user_notebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notebooks"
  ON public.user_notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks"
  ON public.user_notebooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks"
  ON public.user_notebooks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for notebook_entries
CREATE POLICY "Users can view entries in their notebooks"
  ON public.notebook_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_notebooks
      WHERE id = notebook_entries.notebook_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create entries in their notebooks"
  ON public.notebook_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_notebooks
      WHERE id = notebook_entries.notebook_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update entries in their notebooks"
  ON public.notebook_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_notebooks
      WHERE id = notebook_entries.notebook_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete entries in their notebooks"
  ON public.notebook_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_notebooks
      WHERE id = notebook_entries.notebook_id
      AND user_id = auth.uid()
    )
  );

-- RLS policies for notebook_messages
CREATE POLICY "Users can view messages in their entries"
  ON public.notebook_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notebook_entries ne
      JOIN public.user_notebooks un ON ne.notebook_id = un.id
      WHERE ne.id = notebook_messages.entry_id
      AND un.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their entries"
  ON public.notebook_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notebook_entries ne
      JOIN public.user_notebooks un ON ne.notebook_id = un.id
      WHERE ne.id = notebook_messages.entry_id
      AND un.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_user_notebooks_user_id ON public.user_notebooks(user_id);
CREATE INDEX idx_notebook_entries_notebook_id ON public.notebook_entries(notebook_id);
CREATE INDEX idx_notebook_entries_lesson_id ON public.notebook_entries(lesson_id);
CREATE INDEX idx_notebook_messages_entry_id ON public.notebook_messages(entry_id);
CREATE INDEX idx_notebook_messages_created_at ON public.notebook_messages(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_user_notebooks_updated_at
  BEFORE UPDATE ON public.user_notebooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();