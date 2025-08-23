import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserModuleAccess {
  id: string;
  user_email: string;
  module_id: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  notes?: string;
  module?: {
    id: string;
    title: string;
    is_paid: boolean;
  };
}

export interface CreateUserAccessRequest {
  user_email: string;
  module_id: string;
  granted_by?: string;
  expires_at?: string;
  notes?: string;
}

// Hook to get user access records by email
export const useUserAccessByEmail = (email: string) => {
  return useQuery({
    queryKey: ['user-access', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_module_access')
        .select(`
          *,
          module:modules(id, title, is_paid)
        `)
        .eq('user_email', email.toLowerCase());

      if (error) throw error;
      return data as UserModuleAccess[];
    },
    enabled: !!email,
  });
};

// Hook to check if current user has access to a module
export const useUserModuleAccess = (moduleId: string) => {
  return useQuery({
    queryKey: ['user-module-access', moduleId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return false;

      const { data, error } = await supabase
        .from('user_module_access')
        .select('*')
        .eq('user_email', user.email.toLowerCase())
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) throw error;
      
      // Check if access exists and hasn't expired
      if (!data) return false;
      if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
      
      return true;
    },
    enabled: !!moduleId,
  });
};

// Hook to get all modules with access status for current user
export const useUserAccessibleModules = () => {
  return useQuery({
    queryKey: ['user-accessible-modules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all active modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('status', 'active')
        .order('order_index');

      if (modulesError) throw modulesError;

      if (!user?.email) {
        // Return only free modules if not logged in
        return modules.filter(module => !module.is_paid);
      }

      // Get user's access records
      const { data: accessRecords, error: accessError } = await supabase
        .from('user_module_access')
        .select('module_id, expires_at')
        .eq('user_email', user.email.toLowerCase());

      if (accessError) throw accessError;

      // Create a map of accessible module IDs
      const accessibleModuleIds = new Set(
        accessRecords
          .filter(access => !access.expires_at || new Date(access.expires_at) > new Date())
          .map(access => access.module_id)
      );

      // Return modules that are either free or user has access to
      return modules.filter(module => 
        !module.is_paid || accessibleModuleIds.has(module.id)
      );
    },
  });
};

// Hook to create user access
export const useCreateUserAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accessData: CreateUserAccessRequest) => {
      const { data, error } = await supabase
        .from('user_module_access')
        .insert({
          ...accessData,
          user_email: accessData.user_email.toLowerCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access'] });
      toast({
        title: 'הצלחה',
        description: 'הרשאות המשתמש נוצרו בהצלחה',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת הרשאות המשתמש',
        variant: 'destructive',
      });
    },
  });
};

// Hook to update user access
export const useUpdateUserAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<UserModuleAccess> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_module_access')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access'] });
      toast({
        title: 'הצלחה',
        description: 'הרשאות המשתמש עודכנו בהצלחה',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון הרשאות המשתמש',
        variant: 'destructive',
      });
    },
  });
};

// Hook to delete user access
export const useDeleteUserAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('user_module_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access'] });
      toast({
        title: 'הצלחה',
        description: 'הרשאות המשתמש נמחקו בהצלחה',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת הרשאות המשתמש',
        variant: 'destructive',
      });
    },
  });
};

// Hook to bulk grant access to multiple users
export const useBulkGrantAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      emails, 
      moduleIds, 
      grantedBy, 
      expiresAt, 
      notes 
    }: {
      emails: string[];
      moduleIds: string[];
      grantedBy?: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      const accessRecords = emails.flatMap(email =>
        moduleIds.map(moduleId => ({
          user_email: email.toLowerCase(),
          module_id: moduleId,
          granted_by: grantedBy,
          expires_at: expiresAt,
          notes,
        }))
      );

      const { data, error } = await supabase
        .from('user_module_access')
        .upsert(accessRecords, { 
          onConflict: 'user_email,module_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-access'] });
      toast({
        title: 'הצלחה',
        description: `הרשאות נוצרו בהצלחה עבור ${data?.length || 0} רשומות`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במתן הרשאות המשתמשים',
        variant: 'destructive',
      });
    },
  });
};