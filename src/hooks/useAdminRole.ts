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
      
      // Use DB-level admin check function for security
      const { data: isAdminResult, error: adminError } = await supabase
        .rpc('is_admin');
      
      if (adminError) {
        console.error('Error checking admin status:', adminError);
        return { isAdmin: false, profile: null };
      }
      
      // Also fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return { isAdmin: isAdminResult || false, profile: null };
      }
      
      return {
        isAdmin: isAdminResult || false,
        profile: profile as UserProfile
      };
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute for security
  });
};

export const useAdminElevation = () => {
  return async (secretCode: string) => {
    const { data, error } = await supabase
      .rpc('set_current_user_admin', { secret_code: secretCode });
    
    if (error) {
      throw error;
    }
    
    return data;
  };
};