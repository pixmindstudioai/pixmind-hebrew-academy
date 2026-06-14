import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentWithDetails {
  id: string;
  email: string;
  full_name: string;
  profile_picture_url?: string;
  created_at: string;
  last_login_at?: string;
  status: 'active' | 'blocked';
  device_count: number;
  xp_total: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  enrolled_modules: Array<{
    module_id: string;
    module_title: string;
    granted_at: string;
    expires_at?: string;
  }>;
  progress_summary: {
    total_lessons: number;
    completed_lessons: number;
  };
}

export interface StudentFilters {
  searchTerm?: string;
  moduleId?: string;
  status?: 'active' | 'blocked';
  dateFrom?: string;
  dateTo?: string;
}

// Fetch all students with filters
export const useStudents = (filters?: StudentFilters) => {
  return useQuery({
    queryKey: ['admin-students', filters],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Apply date filters
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data: users, error } = await query;
      if (error) throw error;

      // Fetch enrollment and progress data for each user
      const studentsWithDetails = await Promise.all(
        users.map(async (user) => {
          // Get enrolled modules
          const { data: enrollments } = await supabase
            .from('user_module_access')
            .select(`
              module_id,
              granted_at,
              expires_at,
              module:modules(title)
            `)
            .eq('user_email', user.email);

          const enrolled_modules = (enrollments || []).map((e: any) => ({
            module_id: e.module_id,
            module_title: e.module?.title || 'Unknown',
            granted_at: e.granted_at,
            expires_at: e.expires_at,
          }));

          // Get progress summary
          const { data: progress } = await supabase
            .from('user_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id);

          const progress_summary = {
            total_lessons: progress?.length || 0,
            completed_lessons: progress?.filter(p => p.completed).length || 0,
          };

          return {
            ...user,
            xp_total: (user as any).xp_total ?? 0,
            level: (user as any).level ?? 1,
            current_streak: (user as any).current_streak ?? 0,
            longest_streak: (user as any).longest_streak ?? 0,
            enrolled_modules,
            progress_summary,
          } as StudentWithDetails;
        })
      );

      // Apply client-side filters
      let filteredStudents = studentsWithDetails;

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredStudents = filteredStudents.filter(s =>
          s.full_name?.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          s.enrolled_modules.some(m => m.module_title.toLowerCase().includes(term))
        );
      }

      if (filters?.moduleId) {
        filteredStudents = filteredStudents.filter(s =>
          s.enrolled_modules.some(m => m.module_id === filters.moduleId)
        );
      }

      return filteredStudents;
    },
    staleTime: 30000,
  });
};

// Fetch single student with full details
export const useStudentDetails = (studentId: string) => {
  return useQuery({
    queryKey: ['admin-student-details', studentId],
    queryFn: async () => {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;

      // Get enrolled modules with full details
      const { data: enrollments } = await supabase
        .from('user_module_access')
        .select(`
          module_id,
          granted_at,
          expires_at,
          notes,
          provider,
          module:modules(id, title, description, thumbnail_url)
        `)
        .eq('user_email', user.email);

      // Get all progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select(`
          *,
          lesson:lessons(title, chapter:chapters(title, module:modules(title)))
        `)
        .eq('user_id', studentId)
        .order('updated_at', { ascending: false });

      // Get activity log
      const { data: activity } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(50);

      return {
        user,
        enrollments: enrollments || [],
        progress: progress || [],
        activity: activity || [],
      };
    },
    enabled: !!studentId,
  });
};

// Update user status (block/unblock)
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'blocked' }) => {
      const { error } = await supabase.rpc('update_user_status', {
        p_user_id: userId,
        p_status: status,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-details', variables.userId] });
      toast.success(variables.status === 'blocked' ? 'המשתמש נחסם בהצלחה' : 'המשתמש שוחרר מחסימה');
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      toast.error('שגיאה בעדכון סטטוס המשתמש');
    },
  });
};

// Grant module access to user
export const useGrantModuleAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userEmail, moduleId, expiresAt, notes }: {
      userEmail: string;
      moduleId: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.rpc('upsert_user_access', {
        p_email: userEmail,
        p_module: moduleId,
        p_expires: expiresAt || null,
        p_notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('הרשמה לקורס הוספה בהצלחה');
    },
    onError: (error) => {
      console.error('Error granting module access:', error);
      toast.error('שגיאה בהוספת הרשמה');
    },
  });
};

// Revoke module access
export const useRevokeModuleAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userEmail, moduleId }: { userEmail: string; moduleId: string }) => {
      const { error } = await supabase
        .from('user_module_access')
        .delete()
        .eq('user_email', userEmail)
        .eq('module_id', moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('הרשמה לקורס הוסרה בהצלחה');
    },
    onError: (error) => {
      console.error('Error revoking module access:', error);
      toast.error('שגיאה בהסרת הרשמה');
    },
  });
};

// Reset user progress for a module
export const useResetModuleProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const { error } = await supabase.rpc('reset_user_module_progress', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-student-details', variables.userId] });
      toast.success('ההתקדמות אופסה בהצלחה');
    },
    onError: (error) => {
      console.error('Error resetting progress:', error);
      toast.error('שגיאה באיפוס ההתקדמות');
    },
  });
};

// Update user profile (admin)
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: {
      userId: string;
      updates: {
        full_name?: string;
        profile_picture_url?: string;
      };
    }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-details', variables.userId] });
      toast.success('פרטי המשתמש עודכנו בהצלחה');
    },
    onError: (error) => {
      console.error('Error updating user profile:', error);
      toast.error('שגיאה בעדכון פרטי המשתמש');
    },
  });
};
