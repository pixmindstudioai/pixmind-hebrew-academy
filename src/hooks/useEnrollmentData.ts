import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Enrollment {
  id: string;
  user_email: string;
  user_name?: string;
  module_id: string;
  module_title: string;
  granted_at: string;
  expires_at?: string;
  provider?: string;
  transaction_id?: string;
  notes?: string;
  is_active: boolean;
}

export interface GrantAccessRequest {
  userEmail: string;
  moduleIds: string[];
  expiresAt?: Date;
  provider?: string;
  transactionId?: string;
  notes?: string;
}

// Fetch enrollments with search and filter
export const useEnrollments = (moduleId?: string, searchQuery?: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['enrollments', moduleId, searchQuery],
    queryFn: async (): Promise<Enrollment[]> => {
      let query = supabase
        .from('user_module_access')
        .select(`
          id,
          user_email,
          module_id,
          granted_at,
          expires_at,
          provider,
          transaction_id,
          notes,
          modules!inner(
            id,
            title
          )
        `)
        .order('granted_at', { ascending: false });

      // Apply module filter
      if (moduleId && moduleId !== 'all') {
        query = query.eq('module_id', moduleId);
      }

      const { data: accessData, error } = await query;
      
      if (error) {
        console.error('Error fetching enrollments:', error);
        throw error;
      }

      // Get user details for enrolled users
      const userEmails = [...new Set(accessData?.map(item => item.user_email) || [])];
      let userData: any = {};

      if (userEmails.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('email', userEmails);

        userData = users?.reduce((acc, user) => {
          acc[user.email] = user;
          return acc;
        }, {}) || {};
      }

      // Combine and process data
      let enrollments: Enrollment[] = (accessData || []).map(item => {
        const user = userData[item.user_email];
        const now = new Date();
        const expiresAt = item.expires_at ? new Date(item.expires_at) : null;
        const isActive = !expiresAt || expiresAt > now;

        return {
          id: item.id,
          user_email: item.user_email,
          user_name: user?.full_name || undefined,
          module_id: item.module_id,
          module_title: (item.modules as any)?.title || 'קורס לא ידוע',
          granted_at: item.granted_at,
          expires_at: item.expires_at,
          provider: item.provider,
          transaction_id: item.transaction_id,
          notes: item.notes,
          is_active: isActive,
        };
      });

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        enrollments = enrollments.filter(enrollment => 
          enrollment.user_email.toLowerCase().includes(query) ||
          (enrollment.user_name && enrollment.user_name.toLowerCase().includes(query)) ||
          enrollment.module_title.toLowerCase().includes(query)
        );
      }

      return enrollments;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Grant access mutation
export const useGrantAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GrantAccessRequest) => {
      const { userEmail, moduleIds, expiresAt, provider, transactionId, notes } = request;

      // Create access records for each module
      const accessRecords = moduleIds.map(moduleId => ({
        user_email: userEmail.toLowerCase().trim(),
        module_id: moduleId,
        expires_at: expiresAt?.toISOString(),
        provider: provider || 'manual',
        transaction_id: transactionId || null,
        notes: notes || null,
        granted_by: 'admin', // Could be dynamic based on current user
      }));

      const { error } = await supabase
        .from('user_module_access')
        .upsert(accessRecords, {
          onConflict: 'user_email,module_id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Error granting access:', error);
        throw error;
      }

      return accessRecords;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({
        title: "גישה נוספה בהצלחה",
        description: "הגישה למשתמש נוספה בהצלחה"
      });
    },
    onError: (error: any) => {
      console.error('Grant access error:', error);
      toast({
        title: "שגיאה במתן גישה",
        description: error.message || "אירעה שגיאה במתן הגישה",
        variant: "destructive"
      });
    },
  });
};

// Revoke access mutation
export const useRevokeAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('user_module_access')
        .delete()
        .eq('id', enrollmentId);

      if (error) {
        console.error('Error revoking access:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({
        title: "גישה הוסרה",
        description: "הגישה למשתמש הוסרה בהצלחה"
      });
    },
    onError: (error: any) => {
      console.error('Revoke access error:', error);
      toast({
        title: "שגיאה במחיקת גישה",
        description: error.message || "אירעה שגיאה במחיקת הגישה",
        variant: "destructive"
      });
    },
  });
};