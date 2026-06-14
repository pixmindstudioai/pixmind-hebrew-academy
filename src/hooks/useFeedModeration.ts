import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicProfile } from "@/hooks/useProfiles";
import type { FeedPost, FeedComment } from "@/hooks/useFeed";
import { toast } from "sonner";

const PROFILE_COLS = "id, full_name, profile_picture_url";

/** All feed posts for moderation (pinned first, then newest), with author display attached. */
export function useAdminFeedPosts() {
  return useQuery({
    queryKey: ["admin-feed-posts"],
    retry: false,
    queryFn: async (): Promise<FeedPost[]> => {
      const { data: posts, error } = await supabase
        .from("feed_posts")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return [];
      const rows = (posts ?? []) as FeedPost[];
      if (!rows.length) return [];

      const authorIds = Array.from(new Set(rows.map((p) => p.author_id)));
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select(PROFILE_COLS)
        .in("id", authorIds);

      const pmap: Record<string, PublicProfile> = {};
      (profiles ?? []).forEach((p: any) => {
        if (p.id) pmap[p.id] = p as PublicProfile;
      });

      return rows.map((p) => ({ ...p, author: pmap[p.author_id] ?? null }));
    },
  });
}

/** Comments on a single post (for the moderation dialog), with author display attached. */
export function useAdminFeedComments(postId: string | null) {
  return useQuery({
    queryKey: ["admin-feed-comments", postId],
    enabled: !!postId,
    retry: false,
    queryFn: async (): Promise<FeedComment[]> => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("feed_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) return [];
      const rows = (data ?? []) as FeedComment[];
      if (!rows.length) return [];

      const ids = Array.from(new Set(rows.map((c) => c.author_id)));
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select(PROFILE_COLS)
        .in("id", ids);

      const pmap: Record<string, PublicProfile> = {};
      (profiles ?? []).forEach((p: any) => {
        if (p.id) pmap[p.id] = p as PublicProfile;
      });

      return rows.map((c) => ({ ...c, author: pmap[c.author_id] ?? null }));
    },
  });
}

/** Pin / unpin a post. */
export function useTogglePinPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("feed_posts")
        .update({ pinned })
        .eq("id", postId);
      if (error) throw error;
      return pinned;
    },
    onSuccess: (pinned) => {
      qc.invalidateQueries({ queryKey: ["admin-feed-posts"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success(pinned ? "הפוסט נעוץ" : "הנעיצה הוסרה");
    },
    onError: () => toast.error("העדכון נכשל, נסו שוב"),
  });
}

/** Delete a feed post (moderation). */
export function useDeleteFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feed-posts"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("הפוסט נמחק");
    },
    onError: () => toast.error("מחיקת הפוסט נכשלה"),
  });
}

/** Delete a single comment (moderation). */
export function useDeleteFeedComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from("feed_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-feed-comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["admin-feed-posts"] });
      qc.invalidateQueries({ queryKey: ["feed-comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("התגובה נמחקה");
    },
    onError: () => toast.error("מחיקת התגובה נכשלה"),
  });
}
