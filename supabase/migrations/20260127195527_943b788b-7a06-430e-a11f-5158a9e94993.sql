-- Create lesson_tasks table
CREATE TABLE public.lesson_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  instructions TEXT NOT NULL,
  allowed_types TEXT[] NOT NULL DEFAULT ARRAY['text'],
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id)
);

-- Create task_submissions table
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.lesson_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('text', 'file', 'image')),
  content_text TEXT,
  content_url TEXT,
  ai_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'approved', 'rejected')),
  ai_confidence NUMERIC(3,2),
  ai_explanation TEXT,
  manual_override BOOLEAN DEFAULT false,
  manual_status TEXT CHECK (manual_status IN ('approved', 'rejected')),
  manual_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_tasks
CREATE POLICY "Anyone can view active lesson tasks"
ON public.lesson_tasks FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage lesson tasks"
ON public.lesson_tasks FOR ALL
USING (public.is_admin());

-- RLS policies for task_submissions
CREATE POLICY "Users can view their own submissions"
ON public.task_submissions FOR SELECT
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.is_admin()
);

CREATE POLICY "Users can create their own submissions"
ON public.task_submissions FOR INSERT
WITH CHECK (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage all submissions"
ON public.task_submissions FOR ALL
USING (public.is_admin());

-- Indexes
CREATE INDEX idx_lesson_tasks_lesson_id ON public.lesson_tasks(lesson_id);
CREATE INDEX idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX idx_task_submissions_user_email ON public.task_submissions(user_email);
CREATE INDEX idx_task_submissions_ai_status ON public.task_submissions(ai_status);

-- Update trigger for updated_at
CREATE TRIGGER update_lesson_tasks_updated_at
  BEFORE UPDATE ON public.lesson_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_submissions_updated_at
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();