-- Add visibility fields to chapters table
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS visibility_mode text NOT NULL DEFAULT 'all',
ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

-- Add CHECK constraint for visibility_mode values in chapters
ALTER TABLE public.chapters 
ADD CONSTRAINT chapters_visibility_mode_check 
CHECK (visibility_mode IN ('all', 'cohort'));

-- Add visibility fields to lessons table  
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS visibility_mode text NOT NULL DEFAULT 'inherit',
ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

-- Add CHECK constraint for visibility_mode values in lessons
ALTER TABLE public.lessons
ADD CONSTRAINT lessons_visibility_mode_check 
CHECK (visibility_mode IN ('inherit', 'all', 'cohort'));

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_chapters_visibility_mode ON public.chapters(visibility_mode);
CREATE INDEX IF NOT EXISTS idx_chapters_cohort_id ON public.chapters(cohort_id);
CREATE INDEX IF NOT EXISTS idx_lessons_visibility_mode ON public.lessons(visibility_mode);
CREATE INDEX IF NOT EXISTS idx_lessons_cohort_id ON public.lessons(cohort_id);

-- Add comments for documentation
COMMENT ON COLUMN public.chapters.visibility_mode IS 'Visibility mode: all = visible to all module students, cohort = visible only to specific cohort';
COMMENT ON COLUMN public.chapters.cohort_id IS 'Reference to cohort when visibility_mode is cohort';
COMMENT ON COLUMN public.lessons.visibility_mode IS 'Visibility mode: inherit = follow chapter visibility, all = all module students, cohort = specific cohort only';
COMMENT ON COLUMN public.lessons.cohort_id IS 'Reference to cohort when visibility_mode is cohort';