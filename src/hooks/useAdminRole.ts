import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'moderator' | 'student';
}

export const useAdminRole = () => {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, profile: null };
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return { isAdmin: false, profile: null };
      }
      
      return {
        isAdmin: profile?.role === 'admin',
        profile: profile as UserProfile
      };
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};