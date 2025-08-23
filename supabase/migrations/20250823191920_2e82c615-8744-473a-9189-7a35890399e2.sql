-- Add payment fields to modules table
ALTER TABLE public.modules 
ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN payment_url TEXT;