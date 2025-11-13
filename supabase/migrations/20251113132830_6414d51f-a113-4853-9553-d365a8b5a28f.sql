-- Add sale pricing fields to modules table
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS regular_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS sale_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP WITH TIME ZONE;

-- Add index for querying active sales
CREATE INDEX IF NOT EXISTS idx_modules_sale_active ON public.modules(sale_active);
CREATE INDEX IF NOT EXISTS idx_modules_sale_dates ON public.modules(sale_start_date, sale_end_date);

-- Add constraint to ensure sale_price is less than regular_price when both exist
ALTER TABLE public.modules
ADD CONSTRAINT check_sale_price_valid 
CHECK (
  sale_price IS NULL OR 
  regular_price IS NULL OR 
  sale_price < regular_price
);

COMMENT ON COLUMN public.modules.regular_price IS 'Regular price of the module in ILS';
COMMENT ON COLUMN public.modules.sale_price IS 'Sale price when sale is active';
COMMENT ON COLUMN public.modules.sale_active IS 'Whether the sale is currently active (manual toggle)';
COMMENT ON COLUMN public.modules.sale_start_date IS 'Optional start date for scheduled sales';
COMMENT ON COLUMN public.modules.sale_end_date IS 'Optional end date for automatic sale expiration';