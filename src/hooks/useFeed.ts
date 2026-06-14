import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PublicProfile } from "@/hooks/useProfiles";
import { toast } from "sonner";

export type PostType = "update" | "win" | "question" | "showcase";

export interface FeedPost {
  id: string;
  author_id: string;
  type: string;
  content: string;
  images: string[];
  tags: string[];
  related_challenge_id: string | null;
  like_count: number;
  comment_count: number;
  pinned: boolean;
  created_at: string;
  author?: PublicProfile | null;
  likedByMe?: boolean;
}

const PROFILE_COLS =
  "id, full_name, profile_picture_url, headline, bio, cover_image_url, links, xp_total, level, current_streak, longest_streak, created_at";

/** The social feed (optionally filtered by post type, or scoped to one author). */
export function useFeed(opts: { type?: PostType | "all"; authorId?: string } = {}) {
  const { type = "all", authorId } = opts;
  const { user } = useAuth();
  return useQuery({
    queryKey: ["feed", type, authorId, user?.id],
    retry: false,
    queryFn: async (): Promise<FeedPost[]> => {
      let q = supabase
        .from("feed_posts")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(80);
      if (type !== "all") q = q.eq("type", type);
      if (authorId) q = q.eq("author_id", authorId);

      const { data: posts, error } = await q;
      if (error) return [];
      const rows = (posts ?? []) as FeedPost[];
      if (!rows.length) return [];

      const authorIds = Array.from(new Set(rows.map((p) => p.author_id)));
      const postIds = rows.map((p) => p.id);

      const [{ data: profiles }, myLikes] = await Promise.all([
        supabase.from("public_profiles").select(PROFILE_COLS).in("id", authorIds),
        user?.id
          ? supabase.from("feed_post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
          : Promise.resolve({ data: [] } as any),
      ]);

      const pmap: Record<string, PublicProfile> = {};
      (profiles ?? []).forEach((p: any) => { if (p.id) pmap[p.id] = p; });
      const liked = new Set((myLikes?.data ?? []).map((l: any) => l.post_id));

      return rows.map((p) => ({ ...p, author: pmap[p.author_id] ?? null, likedByMe: liked.has(p.id) }));
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { type: PostType; content: string; images?: string[]; tags?: string[]; related_challenge_id?: string | null }) => {
      if (!user?.id) throw new Error("not authenticated");
      const { data, error } = await supabase
        .from("feed_posts")
        .insert({
          author_id: user.id,
          type: input.type,
          content: input.content,
          images: input.images ?? [],
          tags: input.tags ?? [],
          related_challenge_id: input.related_challenge_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("פורסם בקהילה 🎉");
    },
    onError: () => toast.error("הפרסום נכשל, נסו שוב"),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.rpc("toggle_post_like", { p_post_id: postId });
      if (error) throw error;
      return data as { ok: boolean; liked: boolean; count: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("הפוסט נמחק");
    },
  });
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: PublicProfile | null;
}

export function useFeedComments(postId: string | null) {
  return useQuery({
    queryKey: ["feed-comments", postId],
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
      const { data: profiles } = await supabase.from("public_profiles").select(PROFILE_COLS).in("id", ids);
      const pmap: Record<string, PublicProfile> = {};
      (profiles ?? []).forEach((p: any) => { if (p.id) pmap[p.id] = p; });
      return rows.map((c) => ({ ...c, author: pmap[c.author_id] ?? null }));
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user?.id) throw new Error("not authenticated");
      const { error } = await supabase.from("feed_comments").insert({ post_id: postId, author_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["feed-comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("שליחת התגובה נכשלה"),
  });
}
