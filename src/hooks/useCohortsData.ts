import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Cohort {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  student_count?: number;
}

export interface CohortStudent {
  id: string;
  cohort_id: string;
  user_id: string | null;
  email: string;
  status: 'active' | 'invited' | 'pending_user';
  created_at: string;
  user?: {
    full_name: string;
  } | null;
}

// Fetch all cohorts for a module with student counts
export const useCohorts = (moduleId: string) => {
  return useQuery({
    queryKey: ['cohorts', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      
      const { data, error } = await supabase
        .from('cohorts' as any)
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching cohorts:', error);
        throw error;
      }
      
      // Get student counts for each cohort
      const cohortsWithCounts = await Promise.all(
        (data || []).map(async (cohort: any) => {
          const { count } = await supabase
            .from('cohort_students' as any)
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', cohort.id);
          
          return {
            ...cohort,
            student_count: count || 0,
          };
        })
      );
      
      return cohortsWithCounts as Cohort[];
    },
    enabled: !!moduleId,
  });
};

// Fetch students for a specific cohort
export const useCohortStudents = (cohortId: string) => {
  return useQuery({
    queryKey: ['cohort-students', cohortId],
    queryFn: async () => {
      if (!cohortId) return [];
      
      const { data, error } = await supabase
        .from('cohort_students' as any)
        .select('*')
        .eq('cohort_id', cohortId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching cohort students:', error);
        throw error;
      }
      
      // Fetch user names separately for students with user_id
      const studentsWithUsers = await Promise.all(
        (data || []).map(async (student: any) => {
          if (student.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', student.user_id)
              .maybeSingle();
            return { ...student, user: user || null };
          }
          return { ...student, user: null };
        })
      );
      
      return studentsWithUsers as CohortStudent[];
    },
    enabled: !!cohortId,
  });
};

// Create cohort mutation
export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      module_id: string;
      name: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      is_active?: boolean;
    }) => {
      const { data: cohort, error } = await supabase
        .from('cohorts' as any)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return cohort;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', variables.module_id] });
      toast.success('המחזור נוצר בהצלחה');
    },
    onError: (error) => {
      console.error('Error creating cohort:', error);
      toast.error('אירעה שגיאה בעת יצירת המחזור');
    },
  });
};

// Update cohort mutation
export const useUpdateCohort = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: string;
      module_id: string;
      name?: string;
      description?: string;
      start_date?: string | null;
      end_date?: string | null;
      is_active?: boolean;
    }) => {
      const { id, module_id, ...updateData } = data;
      const { data: cohort, error } = await supabase
        .from('cohorts' as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return cohort;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', variables.module_id] });
      toast.success('המחזור עודכן בהצלחה');
    },
    onError: (error) => {
      console.error('Error updating cohort:', error);
      toast.error('אירעה שגיאה בעת עדכון המחזור');
    },
  });
};

// Delete cohort mutation
export const useDeleteCohort = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, module_id }: { id: string; module_id: string }) => {
      const { error } = await supabase
        .from('cohorts' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, module_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', variables.module_id] });
      toast.success('המחזור נמחק בהצלחה');
    },
    onError: (error) => {
      console.error('Error deleting cohort:', error);
      toast.error('אירעה שגיאה בעת מחיקת המחזור');
    },
  });
};

// Add students to cohort
export const useAddCohortStudents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cohortId, moduleId, emails }: { 
      cohortId: string; 
      moduleId: string;
      emails: string[];
    }) => {
      const results = {
        added: 0,
        skipped: 0,
        errors: [] as string[],
      };
      
      for (const email of emails) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
          results.errors.push(`מייל לא תקין: ${email}`);
          continue;
        }
        
        try {
          // Check if student already exists in this cohort
          const { data: existing } = await supabase
            .from('cohort_students' as any)
            .select('id')
            .eq('cohort_id', cohortId)
            .eq('email', normalizedEmail)
            .maybeSingle();
          
          if (existing) {
            results.skipped++;
            continue;
          }
          
          // Find user by email
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();
          
          // Insert cohort student
          const { error: insertError } = await supabase
            .from('cohort_students' as any)
            .insert({
              cohort_id: cohortId,
              user_id: user?.id || null,
              email: normalizedEmail,
              status: user ? 'active' : 'pending_user',
            });
          
          if (insertError) {
            results.errors.push(`שגיאה בהוספת ${email}`);
            continue;
          }
          
          // If user exists, grant module access
          if (user) {
            // Check if access already exists
            const { data: existingAccess } = await supabase
              .from('user_module_access')
              .select('id')
              .eq('user_email', normalizedEmail)
              .eq('module_id', moduleId)
              .maybeSingle();
            
            if (!existingAccess) {
              await supabase
                .from('user_module_access')
                .insert({
                  user_email: normalizedEmail,
                  module_id: moduleId,
                  granted_by: 'cohort',
                  notes: `נוסף דרך מחזור`,
                });
            }
          }
          
          results.added++;
        } catch (err) {
          console.error(`Error processing ${email}:`, err);
          results.errors.push(`שגיאה בעיבוד ${email}`);
        }
      }
      
      return results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-students', variables.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['cohorts', variables.moduleId] });
      
      if (results.added > 0) {
        toast.success(`${results.added} תלמידים נוספו למחזור`);
      }
      if (results.skipped > 0) {
        toast.info(`${results.skipped} תלמידים כבר קיימים במחזור`);
      }
      if (results.errors.length > 0) {
        toast.error(results.errors.slice(0, 3).join('\n'));
      }
    },
    onError: (error) => {
      console.error('Error adding students:', error);
      toast.error('אירעה שגיאה בהוספת תלמידים');
    },
  });
};

// Remove student from cohort
export const useRemoveCohortStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, cohortId, moduleId }: { 
      studentId: string; 
      cohortId: string;
      moduleId: string;
    }) => {
      const { error } = await supabase
        .from('cohort_students' as any)
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
      return { studentId, cohortId, moduleId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-students', variables.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['cohorts', variables.moduleId] });
      toast.success('התלמיד הוסר מהמחזור');
    },
    onError: (error) => {
      console.error('Error removing student:', error);
      toast.error('אירעה שגיאה בהסרת התלמיד');
    },
  });
};
