-- Create enum for message types
CREATE TYPE message_type AS ENUM ('support', 'question', 'feedback', 'purchase', 'general');

-- Create enum for message status
CREATE TYPE message_status AS ENUM ('new', 'viewed', 'closed');

-- Create crm_messages table
CREATE TABLE public.crm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  related_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'general',
  status message_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_crm_messages_user_email ON public.crm_messages(user_email);
CREATE INDEX idx_crm_messages_user_id ON public.crm_messages(user_id);
CREATE INDEX idx_crm_messages_status ON public.crm_messages(status);
CREATE INDEX idx_crm_messages_type ON public.crm_messages(message_type);
CREATE INDEX idx_crm_messages_created_at ON public.crm_messages(created_at DESC);
CREATE INDEX idx_crm_messages_module ON public.crm_messages(related_module_id);
CREATE INDEX idx_crm_messages_lesson ON public.crm_messages(related_lesson_id);

-- Enable RLS
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only can view and manage
CREATE POLICY "Admins can view all messages"
ON public.crm_messages FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update messages"
ON public.crm_messages FOR UPDATE
USING (is_admin());

CREATE POLICY "Users can create messages"
ON public.crm_messages FOR INSERT
WITH CHECK (auth.email() = user_email);

-- Function to update message status
CREATE OR REPLACE FUNCTION public.update_message_status(
  p_message_id UUID,
  p_status message_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can update message status';
  END IF;

  UPDATE public.crm_messages
  SET 
    status = p_status,
    updated_at = now(),
    viewed_at = CASE WHEN p_status = 'viewed' AND viewed_at IS NULL THEN now() ELSE viewed_at END,
    closed_at = CASE WHEN p_status = 'closed' AND closed_at IS NULL THEN now() ELSE closed_at END
  WHERE id = p_message_id;
END;
$$;

-- Function to assign message to staff
CREATE OR REPLACE FUNCTION public.assign_message(
  p_message_id UUID,
  p_assigned_to UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can assign messages';
  END IF;

  UPDATE public.crm_messages
  SET 
    assigned_to = p_assigned_to,
    updated_at = now()
  WHERE id = p_message_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_crm_messages_updated_at
BEFORE UPDATE ON public.crm_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_messages;