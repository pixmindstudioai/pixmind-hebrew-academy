-- Create user_module_access junction table
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  granted_by text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  notes text,
  CONSTRAINT user_module_access_unique UNIQUE (user_email, module_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uma_email ON public.user_module_access (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_uma_module ON public.user_module_access (module_id);

-- Enable RLS
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own access records
CREATE POLICY "Users can read own access by email"
ON public.user_module_access
FOR SELECT
TO authenticated
USING (lower(user_email) = lower((auth.jwt() -> 'email')::text));

-- Allow admins to manage all access records
CREATE POLICY "Admins can manage all access"
ON public.user_module_access
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'admin'::user_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'admin'::user_role
));