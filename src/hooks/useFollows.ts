import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean;
}

/** Follower / following counts for a profile, plus whether *I* follow them. */
export function useFollowStats(userId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follow-stats", userId, user?.id],
    enabled: !!userId,
    retry: false,
    queryFn: async (): Promise<FollowStats> => {
      if (!userId) return { followers: 0, following: 0, isFollowing: false };
      try {
      const [{ count: followers }, { count: following }, mine] = await Promise.all([
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        user?.id
          ? supabase
              .from("user_follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      return {
        followers: followers ?? 0,
        following: following ?? 0,
        isFollowing: !!mine?.data,
      };
      } catch {
        return { followers: 0, following: 0, isFollowing: false };
      }
    },
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) => {
      if (!user?.id) throw new Error("not authenticated");
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: targetId });
      if (error) throw error;
      return true;
    },
    onSuccess: (nowFollowing, vars) => {
      qc.invalidateQueries({ queryKey: ["follow-stats", vars.targetId] });
      toast.success(nowFollowing ? "עוקב/ת ✔" : "הפסקת לעקוב");
    },
    onError: () => toast.error("הפעולה נכשלה"),
  });
}
