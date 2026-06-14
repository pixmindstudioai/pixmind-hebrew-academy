import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicProfile } from "@/hooks/useProfiles";

export interface GamificationStats {
  members: number;
  totalPosts: number;
  posts24h: number;
  badgesAwarded: number;
  activeBadges: number;
  submissionsPending: number;
  totalXp: number;
  topMembers: PublicProfile[];
}

const EMPTY_STATS: GamificationStats = {
  members: 0,
  totalPosts: 0,
  posts24h: 0,
  badgesAwarded: 0,
  activeBadges: 0,
  submissionsPending: 0,
  totalXp: 0,
  topMembers: [],
};

/** Resilient `head`-count helper — returns 0 on any error. */
async function countRows(
  table: Parameters<typeof supabase.from>[0],
  build?: (q: any) => any
): Promise<number> {
  try {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (build) q = build(q);
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Aggregate gamification metrics for the admin dashboard home. */
export function useGamificationStats() {
  return useQuery({
    queryKey: ["admin-gamification-stats"],
    staleTime: 60_000,
    queryFn: async (): Promise<GamificationStats> => {
      try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [
          members,
          totalPosts,
          posts24h,
          badgesAwarded,
          activeBadges,
          submissionsPending,
          totalXp,
          topMembers,
        ] = await Promise.all([
          // members
          countRows("users"),
          // total community posts
          countRows("feed_posts"),
          // posts in the last 24h
          countRows("feed_posts", (q) => q.gt("created_at", since)),
          // badges awarded to members
          countRows("user_badges"),
          // active badge definitions
          countRows("badges", (q) => q.eq("is_active", true)),
          // submissions still awaiting manual review (approximate: not yet manually resolved)
          countRows("task_submissions", (q) =>
            q.is("manual_status", null).neq("ai_status", "approved")
          ),
          // total XP distributed across all members
          (async (): Promise<number> => {
            try {
              const { data, error } = await supabase
                .from("users")
                .select("xp_total")
                .order("xp_total", { ascending: false })
                .limit(5000);
              if (error) return 0;
              return (data ?? []).reduce(
                (sum, row: { xp_total: number | null }) => sum + (row.xp_total ?? 0),
                0
              );
            } catch {
              return 0;
            }
          })(),
          // top members leaderboard
          (async (): Promise<PublicProfile[]> => {
            try {
              const { data, error } = await supabase
                .from("public_profiles")
                .select(
                  "id, full_name, profile_picture_url, xp_total, level, current_streak"
                )
                .order("xp_total", { ascending: false })
                .limit(5);
              if (error) return [];
              return (data ?? []) as PublicProfile[];
            } catch {
              return [];
            }
          })(),
        ]);

        return {
          members,
          totalPosts,
          posts24h,
          badgesAwarded,
          activeBadges,
          submissionsPending,
          totalXp,
          topMembers,
        };
      } catch {
        return EMPTY_STATS;
      }
    },
    retry: false,
  });
}
