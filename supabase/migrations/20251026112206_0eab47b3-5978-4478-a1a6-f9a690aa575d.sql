-- Enable realtime for user_module_access table
ALTER TABLE public.user_module_access REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_module_access;