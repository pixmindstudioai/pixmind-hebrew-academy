-- Create bundles table for course packages
CREATE TABLE public.bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  is_paid BOOLEAN NOT NULL DEFAULT true,
  regular_price NUMERIC,
  sale_price NUMERIC,
  sale_active BOOLEAN DEFAULT false,
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  payment_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_modules junction table
CREATE TABLE public.bundle_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, module_id)
);

-- Create user_bundle_access table for bundle purchases
CREATE TABLE public.user_bundle_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by TEXT,
  transaction_id TEXT,
  notes TEXT,
  UNIQUE(user_email, bundle_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bundle_access ENABLE ROW LEVEL SECURITY;

-- Bundles RLS policies
CREATE POLICY "Anyone can view active bundles"
  ON public.bundles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage bundles"
  ON public.bundles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Bundle modules RLS policies
CREATE POLICY "Anyone can view bundle modules"
  ON public.bundle_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bundles b
      WHERE b.id = bundle_modules.bundle_id AND b.status = 'active'
    )
  );

CREATE POLICY "Admins can manage bundle modules"
  ON public.bundle_modules FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- User bundle access RLS policies
CREATE POLICY "Users can view own bundle access"
  ON public.user_bundle_access FOR SELECT
  USING (lower(user_email) = lower(auth.email()));

CREATE POLICY "Admins can manage all bundle access"
  ON public.user_bundle_access FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_bundles_status ON public.bundles(status);
CREATE INDEX idx_bundles_order ON public.bundles(order_index);
CREATE INDEX idx_bundle_modules_bundle ON public.bundle_modules(bundle_id);
CREATE INDEX idx_bundle_modules_module ON public.bundle_modules(module_id);
CREATE INDEX idx_user_bundle_access_email ON public.user_bundle_access(user_email);
CREATE INDEX idx_user_bundle_access_bundle ON public.user_bundle_access(bundle_id);