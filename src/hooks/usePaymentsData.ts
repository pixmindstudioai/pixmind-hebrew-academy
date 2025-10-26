import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentEnrollment {
  id: string;
  user_email: string;
  module_id: string;
  module_title?: string;
  provider: string;
  transaction_id: string | null;
  granted_at: string;
  expires_at: string | null;
  notes: string | null;
  granted_by: string | null;
}

interface PaymentsFilters {
  startDate?: string;
  endDate?: string;
  moduleId?: string;
  searchQuery?: string;
}

export const usePaymentsData = (filters: PaymentsFilters) => {
  return useQuery({
    queryKey: ['payments-enrollments', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_module_access')
        .select(`
          *,
          modules!inner (
            id,
            title
          )
        `)
        .eq('provider', 'meshulam')
        .order('granted_at', { ascending: false });

      // Apply date range filter
      if (filters.startDate) {
        query = query.gte('granted_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('granted_at', filters.endDate);
      }

      // Apply module filter
      if (filters.moduleId && filters.moduleId !== 'all') {
        query = query.eq('module_id', filters.moduleId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments data:', error);
        throw error;
      }

      // Transform data and apply search filter
      let enrollments = (data || []).map((item: any) => ({
        id: item.id,
        user_email: item.user_email,
        module_id: item.module_id,
        module_title: item.modules?.title,
        provider: item.provider,
        transaction_id: item.transaction_id,
        granted_at: item.granted_at,
        expires_at: item.expires_at,
        notes: item.notes,
        granted_by: item.granted_by,
      }));

      // Apply search filter (email or transaction ID)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        enrollments = enrollments.filter((enrollment: PaymentEnrollment) =>
          enrollment.user_email.toLowerCase().includes(query) ||
          enrollment.transaction_id?.toLowerCase().includes(query) ||
          enrollment.module_title?.toLowerCase().includes(query)
        );
      }

      return enrollments as PaymentEnrollment[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRevokeAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('user_module_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-enrollments'] });
      toast.success('הגישה בוטלה בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error revoking access:', error);
      toast.error('שגיאה בביטול הגישה');
    },
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_module_access')
        .select('id, granted_at, module_id')
        .eq('provider', 'meshulam');

      if (error) {
        console.error('Error fetching payment stats:', error);
        throw error;
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const total = data?.length || 0;
      const last30Days = data?.filter(item => 
        new Date(item.granted_at) >= thirtyDaysAgo
      ).length || 0;
      const last7Days = data?.filter(item => 
        new Date(item.granted_at) >= sevenDaysAgo
      ).length || 0;

      return {
        total,
        last30Days,
        last7Days,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
