-- Insert admin roles into user_roles for all users with role='admin' in users table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM public.users
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;