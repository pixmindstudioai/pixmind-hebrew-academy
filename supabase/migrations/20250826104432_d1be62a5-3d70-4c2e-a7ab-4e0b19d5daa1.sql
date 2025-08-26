-- Add missing columns to user_module_access table for course enrollments management
ALTER TABLE public.user_module_access 
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS transaction_id text;