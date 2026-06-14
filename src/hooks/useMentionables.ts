import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMembersDirectory } from "@/hooks/useProfiles";
import { useAllTasks } from "@/hooks/useTasksData";

export type MentionableType = "user" | "lesson" | "task";

export interface Mentionable {
  type: MentionableType;
  id: string;
  label: string;
  sublabel?: string;
  avatar?: string | null;
}

/** Active lessons (id + title) for @-mention autocomplete. */
function useMentionableLessons() {
  return useQuery({
    queryKey: ["mentionable-lessons"],
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<{ id: string; title: string }[]> => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id,title")
        .eq("status", "active")
        .limit(200);
      if (error) return [];
      return (data ?? []) as { id: string; title: string }[];
    },
  });
}

/**
 * Combined directory of everything that can be @-mentioned in a post:
 * members, active lessons, and challenges (tasks).
 */
export function useMentionables(): { items: Mentionable[]; isLoading: boolean } {
  const members = useMembersDirectory("", 50);
  const lessons = useMentionableLessons();
  const tasks = useAllTasks();

  const items = useMemo<Mentionable[]>(() => {
    const out: Mentionable[] = [];

    (members.data ?? []).forEach((m) => {
      out.push({
        type: "user",
        id: m.id,
        label: m.full_name || "משתמש",
        sublabel: m.headline || undefined,
        avatar: m.profile_picture_url,
      });
    });

    (lessons.data ?? []).forEach((l) => {
      out.push({
        type: "lesson",
        id: l.id,
        label: l.title || "שיעור",
        sublabel: "שיעור",
      });
    });

    ((tasks.data ?? []) as any[]).forEach((t) => {
      out.push({
        type: "task",
        id: t.id,
        label: t.lessons?.title ?? "אתגר",
        sublabel: "אתגר",
      });
    });

    return out;
  }, [members.data, lessons.data, tasks.data]);

  return {
    items,
    isLoading: members.isLoading || lessons.isLoading || tasks.isLoading,
  };
}

/** Case-insensitive substring filter over mentionable labels/sublabels. */
export function filterMentionables(items: Mentionable[], query: string): Mentionable[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 20);
  return items
    .filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.sublabel ? it.sublabel.toLowerCase().includes(q) : false),
    )
    .slice(0, 20);
}
