import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProfile {
  id: string;
  full_name: string | null;
  profile_picture_url: string | null;
  headline: string | null;
  bio: string | null;
  cover_image_url: string | null;
  links: unknown;
  xp_total: number | null;
  level: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  created_at: string | null;
}

const PROFILE_COLS =
  "id, full_name, profile_picture_url, headline, bio, cover_image_url, links, xp_total, level, current_streak, longest_streak, created_at";

/** A single public profile (safe columns only). */
export function usePublicProfile(userId?: string | null) {
  return useQuery({
    queryKey: ["public-profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PublicProfile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("public_profiles")
        .select(PROFILE_COLS)
        .eq("id", userId)
        .maybeSingle();
      if (error) return null;
      return data as PublicProfile | null;
    },
    retry: false,
  });
}

/** Batch-fetch a set of profiles -> id->profile map (for feed authors, chat, etc.). */
export function useProfilesMap(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  return useQuery({
    queryKey: ["profiles-map", unique.sort().join(",")],
    enabled: unique.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, PublicProfile>> => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select(PROFILE_COLS)
        .in("id", unique);
      if (error) return {};
      const map: Record<string, PublicProfile> = {};
      (data ?? []).forEach((p: any) => {
        if (p.id) map[p.id] = p as PublicProfile;
      });
      return map;
    },
  });
}

/** XP-ranked leaderboard (top members). */
export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    staleTime: 30_000,
    queryFn: async (): Promise<PublicProfile[]> => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select(PROFILE_COLS)
        .order("xp_total", { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data ?? []) as PublicProfile[];
    },
    retry: false,
  });
}

/** A directory of members (for search / discover). */
export function useMembersDirectory(search = "", limit = 50) {
  return useQuery({
    queryKey: ["members-directory", search, limit],
    staleTime: 30_000,
    queryFn: async (): Promise<PublicProfile[]> => {
      let q = supabase
        .from("public_profiles")
        .select(PROFILE_COLS)
        .order("xp_total", { ascending: false })
        .limit(limit);
      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) return [];
      return (data ?? []) as PublicProfile[];
    },
    retry: false,
  });
}
