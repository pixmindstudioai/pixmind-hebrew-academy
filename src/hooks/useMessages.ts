import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PublicProfile } from "@/hooks/useProfiles";

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
  read_at: string | null;
}

export interface Conversation {
  otherId: string;
  other?: PublicProfile | null;
  lastMessage: DirectMessage;
  unread: number;
}

const PROFILE_COLS =
  "id, full_name, profile_picture_url, headline, bio, cover_image_url, links, xp_total, level, current_streak, longest_streak, created_at";

/** Conversation list — latest message per partner + unread counts. */
export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
    retry: false,
    refetchInterval: 15_000,
    queryFn: async (): Promise<Conversation[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) return [];
      const rows = (data ?? []) as DirectMessage[];

      const byOther = new Map<string, Conversation>();
      for (const m of rows) {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        let conv = byOther.get(otherId);
        if (!conv) {
          conv = { otherId, lastMessage: m, unread: 0 };
          byOther.set(otherId, conv);
        }
        if (m.recipient_id === user.id && !m.read_at) conv.unread += 1;
      }

      const others = Array.from(byOther.keys());
      if (others.length) {
        const { data: profiles } = await supabase.from("public_profiles").select(PROFILE_COLS).in("id", others);
        const pmap: Record<string, PublicProfile> = {};
        (profiles ?? []).forEach((p: any) => { if (p.id) pmap[p.id] = p; });
        byOther.forEach((conv) => { conv.other = pmap[conv.otherId] ?? null; });
      }
      return Array.from(byOther.values());
    },
  });
}

/** Messages in a single thread (polled). */
export function useThread(otherId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["thread", user?.id, otherId],
    enabled: !!user?.id && !!otherId,
    retry: false,
    refetchInterval: 5_000,
    queryFn: async (): Promise<DirectMessage[]> => {
      if (!user?.id || !otherId) return [];
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) return [];
      return (data ?? []) as DirectMessage[];
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ to, content, attachment }: { to: string; content: string; attachment?: { url: string; type: string; name: string } }) => {
      if (!user?.id) throw new Error("not authenticated");
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        recipient_id: to,
        content,
        attachment_url: attachment?.url ?? null,
        attachment_type: attachment?.type ?? null,
        attachment_name: attachment?.name ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["thread", user?.id, vars.to] });
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });
}

/** Mark all messages from a partner as read. */
export function useMarkRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (otherId: string) => {
      if (!user?.id) return;
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", user.id)
        .eq("sender_id", otherId)
        .is("read_at", null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations", user?.id] }),
  });
}
