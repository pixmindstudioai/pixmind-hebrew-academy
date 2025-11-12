-- Add is_hidden column to modules table
ALTER TABLE public.modules
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.modules.is_hidden IS 'Controls whether the course is hidden from public view. Enrolled users can still access hidden courses.';

-- Create index for faster filtering
CREATE INDEX idx_modules_is_hidden ON public.modules(is_hidden) WHERE is_hidden = true;

-- Update RLS policy to allow filtering by is_hidden for public view
-- This ensures non-enrolled users can't see hidden courses
CREATE POLICY "Public can view non-hidden active modules" 
ON public.modules 
FOR SELECT 
USING (status = 'active' AND is_hidden = false);

-- Drop the old policy that allowed viewing all active modules
DROP POLICY IF EXISTS "Anyone can view active modules" ON public.modules;