import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminBadge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  tier: string;
  xp_bonus: number;
  sort_order: number;
  is_active: boolean;
  criteria: unknown;
  created_at: string;
}

export interface BadgeInput {
  code: string;
  name: string;
  description?: string | null;
  icon: string;
  tier: string;
  xp_bonus: number;
  sort_order: number;
  is_active: boolean;
}

/** Admin: the full badge catalogue, ordered by sort_order. */
export function useAdminBadges() {
  return useQuery({
    queryKey: ["admin-badges"],
    queryFn: async (): Promise<AdminBadge[]> => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminBadge[];
    },
  });
}

/** Admin: create a new badge. */
export function useCreateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BadgeInput) => {
      const { data, error } = await supabase
        .from("badges")
        .insert({
          code: input.code,
          name: input.name,
          description: input.description || null,
          icon: input.icon,
          tier: input.tier,
          xp_bonus: input.xp_bonus,
          sort_order: input.sort_order,
          is_active: input.is_active,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-badges"] });
      toast.success("התג נוצר בהצלחה");
    },
    onError: () => toast.error("יצירת התג נכשלה"),
  });
}

/** Admin: update an existing badge. */
export function useUpdateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BadgeInput> & { id: string }) => {
      const payload: Record<string, unknown> = { ...updates };
      if ("description" in payload) payload.description = payload.description || null;
      const { data, error } = await supabase
        .from("badges")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-badges"] });
      toast.success("התג עודכן בהצלחה");
    },
    onError: () => toast.error("עדכון התג נכשל"),
  });
}

/** Admin: delete a badge. */
export function useDeleteBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("badges").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-badges"] });
      toast.success("התג נמחק בהצלחה");
    },
    onError: () => toast.error("מחיקת התג נכשלה"),
  });
}
