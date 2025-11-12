import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Purchase {
  id: string;
  user_email: string;
  module_id: string | null;
  amount: number;
  currency: string;
  transaction_id: string;
  provider: string;
  payment_date: string;
  status: string;
  payment_desc: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseWithModule extends Purchase {
  module_title?: string;
}

export interface PurchaseFilters {
  dateFrom?: string;
  dateTo?: string;
  moduleId?: string;
  search?: string;
}

export const usePurchases = (filters?: PurchaseFilters) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['purchases', filters],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          modules (
            id,
            title
          )
        `)
        .order('payment_date', { ascending: false });

      // Apply filters
      if (filters?.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('payment_date', filters.dateTo);
      }
      if (filters?.moduleId) {
        query = query.eq('module_id', filters.moduleId);
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        query = query.or(
          `user_email.ilike.%${searchLower}%,full_name.ilike.%${searchLower}%,transaction_id.ilike.%${searchLower}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching purchases:', error);
        throw error;
      }

      // Transform to include module title
      return (data || []).map((purchase: any) => ({
        ...purchase,
        module_title: purchase.modules?.title || 'לא נמצא קורס',
      })) as PurchaseWithModule[];
    },
  });

  // Enable real-time subscription for purchases
  useEffect(() => {
    const channel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['purchases'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const usePurchaseStats = () => {
  return useQuery({
    queryKey: ['purchase-stats'],
    queryFn: async () => {
      const { data: allPurchases, error: allError } = await supabase
        .from('purchases')
        .select('amount, payment_date')
        .eq('status', 'completed');

      if (allError) throw allError;

      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const purchases = allPurchases || [];
      const totalRevenue = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const last30DaysRevenue = purchases
        .filter((p) => new Date(p.payment_date) >= last30Days)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const last7DaysRevenue = purchases
        .filter((p) => new Date(p.payment_date) >= last7Days)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      return {
        total: purchases.length,
        totalRevenue,
        last30Days: purchases.filter((p) => new Date(p.payment_date) >= last30Days).length,
        last30DaysRevenue,
        last7Days: purchases.filter((p) => new Date(p.payment_date) >= last7Days).length,
        last7DaysRevenue,
      };
    },
  });
};

export const useRevokeModuleAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userEmail, moduleId }: { userEmail: string; moduleId: string }) => {
      const { error } = await supabase
        .from('user_module_access')
        .delete()
        .eq('user_email', userEmail.toLowerCase())
        .eq('module_id', moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['user-module-access'] });
      toast.success('גישת המשתמש לקורס בוטלה בהצלחה');
    },
    onError: (error) => {
      console.error('Error revoking access:', error);
      toast.error('שגיאה בביטול גישה');
    },
  });
};

export const useWebhookLogs = (limit = 50) => {
  return useQuery({
    queryKey: ['webhook-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};
