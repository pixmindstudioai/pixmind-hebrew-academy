import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Admin: manually grant XP to a member (server-authoritative via award_xp RPC). */
export function useGrantXp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason?: string }) => {
      const { data, error } = await supabase.rpc("award_xp", {
        p_user_id: userId,
        p_amount: amount,
        p_source_type: "admin_grant",
        p_reason: reason || "הענקת XP ידנית",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["admin-student-details", vars.userId] });
      qc.invalidateQueries({ queryKey: ["user-xp-ledger", vars.userId] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success(`הוענקו ${vars.amount} XP`);
    },
    onError: () => toast.error("הענקת ה-XP נכשלה"),
  });
}

/** Admin: award a badge to a member (+ optional bonus XP). */
export function useAwardBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, badgeId, xpBonus = 0 }: { userId: string; badgeId: string; xpBonus?: number }) => {
      const { error } = await supabase
        .from("user_badges")
        .insert({ user_id: userId, badge_id: badgeId });
      // unique_violation -> already has the badge; treat as a no-op
      if (error && (error as any).code !== "23505") throw error;
      const already = !!error;
      if (!already && xpBonus > 0) {
        await supabase.rpc("award_xp", {
          p_user_id: userId,
          p_amount: xpBonus,
          p_source_type: "badge",
          p_source_id: badgeId,
          p_reason: "בונוס תג",
        });
      }
      return { already };
    },
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["earned-badges", vars.userId] });
      qc.invalidateQueries({ queryKey: ["admin-student-details", vars.userId] });
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(res.already ? "לתלמיד כבר יש את התג הזה" : "התג הוענק 🏅");
    },
    onError: () => toast.error("הענקת התג נכשלה"),
  });
}

/** Admin: a member's XP ledger by id (for the student profile). */
export function useUserXpLedger(userId?: string | null, limit = 40) {
  return useQuery({
    queryKey: ["user-xp-ledger", userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("xp_transactions")
        .select("id, amount, source_type, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return data ?? [];
    },
  });
}
