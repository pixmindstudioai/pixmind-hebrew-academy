import { useState } from "react";
import AuthenticationGuard from "@/components/admin/AuthenticationGuard";
import {
  useAdminBadges,
  useCreateBadge,
  useUpdateBadge,
  useDeleteBadge,
  type AdminBadge,
  type BadgeInput,
} from "@/hooks/useBadgesData";
import { useAwardBadge } from "@/hooks/useAdminGamification";
import { useMembersDirectory, type PublicProfile } from "@/hooks/useProfiles";
import { BadgeMedallion, getIcon } from "@/components/gamification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  Search,
  CheckCircle2,
  XCircle,
  Gift,
} from "lucide-react";

const ICON_NAMES = [
  "Award", "Trophy", "Star", "Sparkles", "Flame", "Target", "Heart",
  "MessageCircle", "GraduationCap", "Footprints", "Zap", "Crown", "Medal",
  "Rocket", "BookOpen", "CheckCircle2", "Users", "TrendingUp",
];

const TIERS: { value: string; label: string }[] = [
  { value: "bronze", label: "ברונזה" },
  { value: "silver", label: "כסף" },
  { value: "gold", label: "זהב" },
  { value: "special", label: "מיוחד" },
];

const tierLabel = (tier: string) =>
  TIERS.find((t) => t.value === tier)?.label ?? tier;

const emptyForm: BadgeInput = {
  code: "",
  name: "",
  description: "",
  icon: "Award",
  tier: "bronze",
  xp_bonus: 0,
  sort_order: 0,
  is_active: true,
};

function BadgesPage() {
  const { data: badges, isLoading } = useAdminBadges();
  const createBadge = useCreateBadge();
  const updateBadge = useUpdateBadge();
  const deleteBadge = useDeleteBadge();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBadge | null>(null);
  const [form, setForm] = useState<BadgeInput>(emptyForm);
  const [isAwardOpen, setIsAwardOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsEditOpen(true);
  };

  const openEdit = (badge: AdminBadge) => {
    setEditing(badge);
    setForm({
      code: badge.code,
      name: badge.name,
      description: badge.description ?? "",
      icon: badge.icon,
      tier: badge.tier,
      xp_bonus: badge.xp_bonus,
      sort_order: badge.sort_order,
      is_active: badge.is_active,
    });
    setIsEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateBadge.mutateAsync({ id: editing.id, ...form });
    } else {
      await createBadge.mutateAsync(form);
    }
    setIsEditOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = (badge: AdminBadge) => {
    if (window.confirm(`למחוק את התג "${badge.name}"?`)) {
      deleteBadge.mutate(badge.id);
    }
  };

  const PreviewIcon = getIcon(form.icon);

  return (
    <AuthenticationGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">תגים והישגים</h1>
            <p className="text-muted-foreground">
              ניהול קטלוג התגים והענקת הישגים לתלמידים
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsAwardOpen(true)}>
              <Gift className="h-4 w-4" />
              הענק תג לתלמיד
            </Button>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              צור תג חדש
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !badges?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">אין תגים עדיין</h3>
              <p className="mb-4 text-muted-foreground">
                צור את התג הראשון כדי להתחיל לבנות מערכת הישגים
              </p>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                צור תג חדש
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {badges.map((badge) => (
              <Card
                key={badge.id}
                className={cn("transition-all", !badge.is_active && "opacity-60")}
              >
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                  <div className="flex items-center justify-between gap-2 self-stretch">
                    <Badge
                      variant={badge.is_active ? "default" : "outline"}
                      className="gap-1"
                    >
                      {badge.is_active ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {badge.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="עריכה"
                        onClick={() => openEdit(badge)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="מחיקה"
                        onClick={() => handleDelete(badge)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <BadgeMedallion
                    badge={{
                      name: badge.name,
                      description: badge.description,
                      icon: badge.icon,
                      tier: badge.tier,
                      earned: true,
                    }}
                    size={64}
                  />

                  <div className="space-y-1">
                    <h3 className="font-semibold">{badge.name}</h3>
                    {badge.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {badge.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="secondary">{tierLabel(badge.tier)}</Badge>
                    <Badge variant="outline" className="text-primary">
                      +{badge.xp_bonus} XP
                    </Badge>
                  </div>

                  <code className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {badge.code}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditing(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת תג" : "תג חדש"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>קוד מזהה</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="first_task"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>שם</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="צעד ראשון"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="תיאור קצר של ההישג..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>אייקון</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-primary">
                  <PreviewIcon className="h-5 w-5" />
                </div>
                <Select
                  value={form.icon}
                  onValueChange={(v) => setForm({ ...form, icon: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_NAMES.map((name) => {
                      const Ico = getIcon(name);
                      return (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center gap-2">
                            <Ico className="h-4 w-4" />
                            {name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>דרגה</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm({ ...form, tier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>בונוס XP</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.xp_bonus}
                  onChange={(e) =>
                    setForm({ ...form, xp_bonus: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <div className="space-y-2">
                <Label>סדר תצוגה</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>תג פעיל</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_active: checked })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createBadge.isPending || updateBadge.isPending}
              >
                {editing ? "שמור שינויים" : "צור תג"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Award badge to member dialog */}
      <AwardBadgeDialog
        open={isAwardOpen}
        onOpenChange={setIsAwardOpen}
        badges={badges ?? []}
      />
    </AuthenticationGuard>
  );
}

interface AwardBadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges: AdminBadge[];
}

function AwardBadgeDialog({ open, onOpenChange, badges }: AwardBadgeDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<PublicProfile | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("");
  const { data: members, isLoading: membersLoading } = useMembersDirectory(query, 20);
  const awardBadge = useAwardBadge();

  const reset = () => {
    setQuery("");
    setSelectedMember(null);
    setSelectedBadgeId("");
  };

  const handleAward = async () => {
    if (!selectedMember || !selectedBadgeId) return;
    const badge = badges.find((b) => b.id === selectedBadgeId);
    await awardBadge.mutateAsync({
      userId: selectedMember.id,
      badgeId: selectedBadgeId,
      xpBonus: badge?.xp_bonus ?? 0,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הענקת תג לתלמיד</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>בחירת תלמיד</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedMember.profile_picture_url ?? undefined} />
                    <AvatarFallback>
                      {selectedMember.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {selectedMember.full_name ?? "ללא שם"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedMember(null)}
                >
                  שנה
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="חיפוש לפי שם..."
                    className="pr-9"
                  />
                </div>
                <ScrollArea className="h-52 rounded-lg border">
                  {membersLoading ? (
                    <div className="space-y-2 p-2">
                      {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !members?.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      לא נמצאו תלמידים
                    </p>
                  ) : (
                    <div className="p-1">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMember(m)}
                          className="flex w-full items-center gap-3 rounded-md p-2 text-right transition-colors hover:bg-muted"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={m.profile_picture_url ?? undefined} />
                            <AvatarFallback>{m.full_name?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-medium">
                            {m.full_name ?? "ללא שם"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>בחירת תג</Label>
            <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תג להענקה" />
              </SelectTrigger>
              <SelectContent>
                {badges
                  .filter((b) => b.is_active)
                  .map((b) => {
                    const Ico = getIcon(b.icon);
                    return (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <Ico className="h-4 w-4" />
                          {b.name}
                          <span className="text-xs text-muted-foreground">
                            (+{b.xp_bonus} XP)
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 gap-2"
              onClick={handleAward}
              disabled={!selectedMember || !selectedBadgeId || awardBadge.isPending}
            >
              <Award className="h-4 w-4" />
              הענק תג
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BadgesPage;
