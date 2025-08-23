-- Add is_verified column to modules table
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_modules_verified_created_by
  ON modules (is_verified, created_by);

-- Update existing modules created by admin to be verified
UPDATE modules 
SET is_verified = true 
WHERE created_by = '00000000-0000-0000-0000-000000000000'::uuid;