-- Add was_free_before and became_paid_at columns to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS was_free_before boolean NOT NULL DEFAULT false;

ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS became_paid_at timestamp with time zone DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.modules.was_free_before IS 'If true, this module was previously free and legacy users keep free access';
COMMENT ON COLUMN public.modules.became_paid_at IS 'Timestamp when the module was converted from free to paid';

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_modules_was_free_before ON public.modules(was_free_before) WHERE was_free_before = true;