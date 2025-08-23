-- Remove foreign key constraint on modules.created_by
-- This allows admin placeholder ID without requiring actual user record

ALTER TABLE public.modules 
DROP CONSTRAINT IF EXISTS modules_created_by_fkey;

-- Verify the field remains as UUID but without foreign key enforcement
-- The created_by field will remain for tracking but won't enforce user existence