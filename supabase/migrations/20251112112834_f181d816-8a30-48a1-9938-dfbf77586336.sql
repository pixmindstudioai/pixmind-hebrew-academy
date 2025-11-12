-- Create purchases table to track all course purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'ILS',
  transaction_id TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT 'meshulam',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'completed',
  payment_desc TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create webhook_logs table for traceability
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "Admins can manage all purchases"
ON public.purchases
FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
USING (lower(user_email) = lower(auth.email()));

-- RLS Policies for webhook_logs
CREATE POLICY "Admins can manage webhook logs"
ON public.webhook_logs
FOR ALL
USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_purchases_user_email ON public.purchases(user_email);
CREATE INDEX idx_purchases_transaction_id ON public.purchases(transaction_id);
CREATE INDEX idx_purchases_payment_date ON public.purchases(payment_date DESC);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed) WHERE processed = false;

-- Update trigger for purchases
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for purchases
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;