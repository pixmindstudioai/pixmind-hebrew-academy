import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserCohortMembership {
  cohort_id: string;
  cohort_name: string;
  module_id: string;
}

/**
 * Hook to fetch cohorts that the current user belongs to for a specific module
 */
export const useUserCohortsForModule = (moduleId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-cohorts', moduleId, user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id && !user?.email) return [];

      // Fetch cohort memberships for this user in this module
      const { data, error } = await supabase
        .from('cohort_students')
        .select(`
          cohort_id,
          cohorts!inner (
            id,
            name,
            module_id,
            is_active
          )
        `)
        .or(`user_id.eq.${user?.id},email.ilike.${user?.email?.toLowerCase()}`)
        .in('status', ['active', 'invited']) as any;

      if (error) {
        console.error('Error fetching user cohorts:', error);
        return [];
      }

      // Filter by module and active cohorts
      const cohorts = (data || [])
        .filter((item: any) => 
          item.cohorts?.module_id === moduleId && 
          item.cohorts?.is_active === true
        )
        .map((item: any) => ({
          cohort_id: item.cohort_id,
          cohort_name: item.cohorts.name,
          module_id: item.cohorts.module_id,
        }));

      return cohorts as UserCohortMembership[];
    },
    enabled: !!moduleId && !!(user?.id || user?.email),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Visibility helpers for chapters and lessons
 */
export const isChapterVisible = (
  chapter: { visibility_mode?: string; cohort_id?: string | null },
  allowedCohortIds: string[]
): boolean => {
  if (chapter.visibility_mode === 'cohort') {
    if (!chapter.cohort_id) return false;
    return allowedCohortIds.includes(chapter.cohort_id);
  }
  // Default 'all' or null - visible to everyone with module access
  return true;
};

export const isLessonVisible = (
  lesson: { visibility_mode?: string; cohort_id?: string | null },
  chapter: { visibility_mode?: string; cohort_id?: string | null },
  allowedCohortIds: string[]
): boolean => {
  // 'inherit' or null - follow chapter visibility
  if (!lesson.visibility_mode || lesson.visibility_mode === 'inherit') {
    return isChapterVisible(chapter, allowedCohortIds);
  }

  // 'all' - visible to all module students
  if (lesson.visibility_mode === 'all') {
    return true;
  }

  // 'cohort' - visible only to specific cohort
  if (lesson.visibility_mode === 'cohort') {
    if (!lesson.cohort_id) return false;
    return allowedCohortIds.includes(lesson.cohort_id);
  }

  // Fallback: treat as hidden
  return false;
};

/**
 * Filter chapters for student view based on cohort visibility
 */
export const filterVisibleChapters = <T extends { visibility_mode?: string; cohort_id?: string | null }>(
  chapters: T[],
  allowedCohortIds: string[]
): T[] => {
  return chapters.filter(chapter => isChapterVisible(chapter, allowedCohortIds));
};

/**
 * Filter lessons for student view based on cohort visibility
 */
export const filterVisibleLessons = <
  L extends { visibility_mode?: string; cohort_id?: string | null },
  C extends { visibility_mode?: string; cohort_id?: string | null }
>(
  lessons: L[],
  chapter: C,
  allowedCohortIds: string[]
): L[] => {
  return lessons.filter(lesson => isLessonVisible(lesson, chapter, allowedCohortIds));
};
