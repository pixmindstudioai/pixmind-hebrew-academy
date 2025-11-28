-- Security Fix: Strengthen purchases table RLS policies to prevent anonymous access
-- Ensure only authenticated users can view their own purchases

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.purchases;

-- Create strengthened policies that explicitly require authentication

-- Policy 1: Only authenticated users can view their own purchases (by email match)
CREATE POLICY "authenticated_users_view_own_purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND 
    lower(user_email) = lower(auth.email())
  );

-- Policy 2: Admins can view all purchases
CREATE POLICY "admins_view_all_purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy 3: Admins can insert/update/delete purchases
CREATE POLICY "admins_manage_purchases"
  ON public.purchases
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 4: System/webhooks can insert purchases (for payment processing)
-- This allows the meshulam webhook to create purchase records
CREATE POLICY "system_insert_purchases"
  ON public.purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add security documentation
COMMENT ON TABLE public.purchases IS 'Purchase records table. RLS policies ensure only authenticated users can view their own purchases by email match. Admins can manage all purchases. Anonymous access is explicitly denied.';

-- Create index for performance on email lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_email_lower ON public.purchases(lower(user_email));