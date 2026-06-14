import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLevelInfo, levelTitle, type LevelInfo } from "@/lib/levels";
import { toast } from "sonner";

export interface MyProfile {
  id: string;
  full_name: string;
  email: string;
  profile_picture_url: string | null;
  headline: string | null;
  bio: string | null;
  cover_image_url: string | null;
  links: unknown;
  xp_total: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  role: string;
}

export interface GamifiedProfile extends MyProfile {
  levelInfo: LevelInfo;
  title: string;
}

/** The signed-in member's gamified profile (xp / level / streak). */
export function useMyProfile() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<GamifiedProfile | null> => {
      if (!user?.id) return null;
      // Try the full gamified row; gracefully fall back if the migration
      // hasn't run yet (new columns missing) so the shell never crashes.
      const full = await supabase
        .from("users")
        .select(
          "id, full_name, email, profile_picture_url, headline, bio, cover_image_url, links, xp_total, level, current_streak, longest_streak, role"
        )
        .eq("id", user.id)
        .maybeSingle();

      let row: any = full.data;
      if (full.error) {
        const basic = await supabase
          .from("users")
          .select("id, full_name, email, profile_picture_url, role")
          .eq("id", user.id)
          .maybeSingle();
        if (basic.error) throw basic.error;
        row = basic.data;
      }
      if (!row) return null;

      const merged: MyProfile = {
        id: row.id,
        full_name: row.full_name ?? user.user_metadata?.full_name ?? user.email ?? "",
        email: row.email ?? user.email ?? "",
        profile_picture_url: row.profile_picture_url ?? null,
        headline: row.headline ?? null,
        bio: row.bio ?? null,
        cover_image_url: row.cover_image_url ?? null,
        links: row.links ?? [],
        xp_total: row.xp_total ?? 0,
        level: row.level ?? 1,
        current_streak: row.current_streak ?? 0,
        longest_streak: row.longest_streak ?? 0,
        role: row.role ?? "student",
      };
      const levelInfo = getLevelInfo(merged.xp_total);
      return { ...merged, levelInfo, title: levelTitle(levelInfo.level) };
    },
    retry: false,
  });
}

/** Mark a lesson complete (+20 XP, server-authoritative & idempotent). */
export function useCompleteLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ lessonId, done = true }: { lessonId: string; done?: boolean }) => {
      const { data, error } = await supabase.rpc("complete_lesson", {
        p_lesson_id: lessonId,
        p_done: done,
      });
      if (error) throw error;
      return data as { ok: boolean; awarded?: boolean; amount?: number; leveled_up?: boolean; level?: number };
    },
    onSuccess: (res, vars) => {
      if (vars.done && res?.awarded) {
        toast.success(`+${res.amount ?? 20} XP`, {
          description: res.leveled_up ? `🎉 עלית לרמה ${res.level}!` : "כל הכבוד, ממשיכים!",
        });
      }
      qc.invalidateQueries({ queryKey: ["my-profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["xp-ledger", user?.id] });
      qc.invalidateQueries({ queryKey: ["user-progress"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: () => toast.error("שמירת ההתקדמות נכשלה, נסו שוב"),
  });
}

export interface EarnedBadge {
  id: string;
  earned_at: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  tier: string;
  xp_bonus: number;
}

/** Badges a given member (default: me) has earned. */
export function useEarnedBadges(userId?: string) {
  const { user } = useAuth();
  const target = userId ?? user?.id;
  return useQuery({
    queryKey: ["earned-badges", target],
    enabled: !!target,
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<EarnedBadge[]> => {
      if (!target) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("id, earned_at, badges(code, name, description, icon, tier, xp_bonus)")
        .eq("user_id", target)
        .order("earned_at", { ascending: false });
      if (error) return [];
      return (data ?? []).map((row: any) => ({
        id: row.id,
        earned_at: row.earned_at,
        code: row.badges?.code,
        name: row.badges?.name,
        description: row.badges?.description,
        icon: row.badges?.icon ?? "Award",
        tier: row.badges?.tier ?? "bronze",
        xp_bonus: row.badges?.xp_bonus ?? 0,
      }));
    },
  });
}

/** The member's recent XP ledger (for the "summary" recap). */
export function useXpLedger(limit = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["xp-ledger", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("xp_transactions")
        .select("id, amount, source_type, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return data ?? [];
    },
    retry: false,
  });
}
