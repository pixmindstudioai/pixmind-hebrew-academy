-- Create cohorts table for module cohort management
CREATE TABLE public.cohorts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create cohort_students table for student assignments
CREATE TABLE public.cohort_students (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'pending_user')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cohort_id, email)
);

-- Create indexes for better query performance
CREATE INDEX idx_cohorts_module_id ON public.cohorts(module_id);
CREATE INDEX idx_cohort_students_cohort_id ON public.cohort_students(cohort_id);
CREATE INDEX idx_cohort_students_email ON public.cohort_students(lower(email));
CREATE INDEX idx_cohort_students_user_id ON public.cohort_students(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_students ENABLE ROW LEVEL SECURITY;

-- RLS policies for cohorts table (admin only)
CREATE POLICY "Admins can manage all cohorts"
ON public.cohorts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS policies for cohort_students table (admin only)
CREATE POLICY "Admins can manage all cohort students"
ON public.cohort_students
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add comments for documentation
COMMENT ON TABLE public.cohorts IS 'Course module cohorts for organizing students into groups with specific schedules';
COMMENT ON TABLE public.cohort_students IS 'Students assigned to cohorts, linked by email to support pre-registration';
COMMENT ON COLUMN public.cohort_students.status IS 'active = enrolled and has user account, invited = sent invitation, pending_user = no user account yet';