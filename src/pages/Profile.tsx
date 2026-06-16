import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Zap,
  Star,
  Flame,
  Users,
  UserPlus,
  UserCheck,
  Award,
  BookOpen,
  Pencil,
  MessageSquare,
  Link2,
  CalendarDays,
  Camera,
  Loader2,
  LogOut,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getLevelInfo, levelTitle } from "@/lib/levels";

import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/useGamification";
import { useEarnedBadges } from "@/hooks/useGamification";
import { usePublicProfile } from "@/hooks/useProfiles";
import { useFollowStats, useToggleFollow } from "@/hooks/useFollows";
import { useFeed } from "@/hooks/useFeed";
import { useMyCertificates } from "@/hooks/useCertificates";
import { useModules, useUserProgress } from "@/hooks/useContentData";

import {
  StatTile,
  LevelChip,
  BadgeGrid,
  type BadgeItem,
} from "@/components/gamification";
import { CoverImageUpload } from "@/components/CoverImageUpload";
import { RestorePurchasesButton } from "@/components/RestorePurchasesButton";

type ProfileLink = { label: string; url: string };

function parseLinks(raw: unknown): ProfileLink[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((l: any) => ({
        label: String(l?.label ?? l?.title ?? l?.url ?? "").trim(),
        url: String(l?.url ?? l?.href ?? "").trim(),
      }))
      .filter((l) => l.url);
  }
  return [];
}

/** Normalised view-model so own + other profiles render identically. */
interface ViewProfile {
  id: string;
  full_name: string | null;
  profile_picture_url: string | null;
  headline: string | null;
  bio: string | null;
  cover_image_url: string | null;
  links: unknown;
  xp_total: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  created_at?: string | null;
}

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const myId = user?.id ?? null;
  const isSelf = !userId || userId === myId;
  const targetId = isSelf ? myId ?? undefined : userId;

  const qc = useQueryClient();
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    qc.clear(); // drop user-scoped cache so the next login starts clean
    navigate("/");
  };

  // Data sources — self uses the gamified "my-profile", others the public view.
  const myProfileQ = useMyProfile();
  const publicProfileQ = usePublicProfile(isSelf ? undefined : userId);

  const profile: ViewProfile | null = useMemo(() => {
    if (isSelf) {
      const p = myProfileQ.data;
      if (!p) return null;
      return {
        id: p.id,
        full_name: p.full_name,
        profile_picture_url: p.profile_picture_url,
        headline: p.headline,
        bio: p.bio,
        cover_image_url: p.cover_image_url,
        links: p.links,
        xp_total: p.xp_total ?? 0,
        level: p.level ?? 1,
        current_streak: p.current_streak ?? 0,
        longest_streak: p.longest_streak ?? 0,
        created_at: null,
      };
    }
    const p = publicProfileQ.data;
    if (!p) return null;
    return {
      id: p.id,
      full_name: p.full_name,
      profile_picture_url: p.profile_picture_url,
      headline: p.headline,
      bio: p.bio,
      cover_image_url: p.cover_image_url,
      links: p.links,
      xp_total: p.xp_total ?? 0,
      level: p.level ?? 1,
      current_streak: p.current_streak ?? 0,
      longest_streak: p.longest_streak ?? 0,
      created_at: p.created_at,
    };
  }, [isSelf, myProfileQ.data, publicProfileQ.data]);

  const profileLoading = isSelf ? myProfileQ.isLoading : publicProfileQ.isLoading;

  const levelInfo = getLevelInfo(profile?.xp_total ?? 0);
  const links = parseLinks(profile?.links);

  // Gamification + social.
  const { data: badges = [] } = useEarnedBadges(targetId);
  const followStatsQ = useFollowStats(isSelf ? undefined : targetId);
  const toggleFollow = useToggleFollow();
  const followers = followStatsQ.data?.followers ?? 0;
  const following = followStatsQ.data?.following ?? 0;
  const isFollowing = followStatsQ.data?.isFollowing ?? false;

  // Self also shows own follow counts (for the stat tiles).
  const selfFollowQ = useFollowStats(isSelf ? targetId : undefined);
  const selfFollowers = selfFollowQ.data?.followers ?? 0;
  const selfFollowing = selfFollowQ.data?.following ?? 0;

  // Posts + courses.
  const { data: posts = [], isLoading: postsLoading } = useFeed({ authorId: targetId });
  const { data: modules = [] } = useModules("all");
  const { data: userProgress = [] } = useUserProgress(targetId);

  // Avatar override so a fresh upload reflects immediately.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    setAvatarUrl(profile?.profile_picture_url ?? null);
  }, [profile?.profile_picture_url]);

  // Cover override so a fresh upload reflects immediately.
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  useEffect(() => {
    setCoverUrl(profile?.cover_image_url ?? null);
  }, [profile?.cover_image_url]);

  // ── Compact avatar uploader (camera overlay, self only) ──────
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !myId) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("נא להעלות קובץ מסוג JPG, PNG או WEBP בלבד");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("גודל הקובץ חייב להיות עד 5MB");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${myId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("user_avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("user_avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_picture_url: publicUrl })
        .eq("id", myId);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile", myId] });
      toast.success("תמונת הפרופיל עודכנה בהצלחה");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!myId || !avatarUrl) return;
    setAvatarUploading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ profile_picture_url: null })
        .eq("id", myId);
      if (error) throw error;

      setAvatarUrl(null);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile", myId] });
      toast.success("תמונת הפרופיל הוסרה");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("שגיאה בהסרת התמונה");
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Edit dialog ──────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    full_name_en: "",
    headline: "",
    bio: "",
    cover_image_url: "",
    linksText: "",
  });

  // Certificates (own profile only)
  const { data: myCertificates = [] } = useMyCertificates();

  const openEdit = () => {
    setForm({
      full_name: profile?.full_name ?? "",
      full_name_en: (profile as any)?.full_name_en ?? "",
      headline: profile?.headline ?? "",
      bio: profile?.bio ?? "",
      cover_image_url: coverUrl ?? profile?.cover_image_url ?? "",
      linksText: parseLinks(profile?.links)
        .map((l) => `${l.label || l.url} | ${l.url}`)
        .join("\n"),
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!myId) return;
    setSaving(true);
    try {
      const parsedLinks: ProfileLink[] = form.linksText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [a, b] = line.split("|").map((s) => s.trim());
          const url = (b || a || "").trim();
          const label = (b ? a : a)?.trim() || url;
          return { label, url };
        })
        .filter((l) => l.url);

      const { error } = await supabase
        .from("users")
        .update({
          full_name: form.full_name.trim() || null,
          full_name_en: form.full_name_en.trim() || null,
          headline: form.headline.trim() || null,
          bio: form.bio.trim() || null,
          cover_image_url: form.cover_image_url.trim() || null,
          links: parsedLinks as any,
        } as any)
        .eq("id", myId);

      if (error) throw error;

      setCoverUrl(form.cover_image_url.trim() || null);
      toast.success("הפרופיל עודכן בהצלחה!");
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile", myId] });
    } catch {
      toast.error("שגיאה בעדכון הפרופיל");
    } finally {
      setSaving(false);
    }
  };

  // ── Course progress (preserved logic, scoped to the viewed user) ──
  const progressList = Array.isArray(userProgress) ? (userProgress as any[]) : [];
  const getModuleProgress = (_moduleId: string) => {
    const entries = progressList.filter((p) => p.lesson_id);
    const completed = entries.filter((p) => p.completed).length;
    const total = entries.length || 1;
    return Math.round((completed / total) * 100);
  };

  const badgeItems: BadgeItem[] = (badges as any[]).map((b) => ({
    code: b.code,
    name: b.name,
    description: b.description,
    icon: b.icon,
    tier: b.tier,
    earned: true,
  }));

  const displayName = profile?.full_name || "משתמש";
  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
      })
    : null;

  // ── Loading skeleton ─────────────────────────────────────────
  if (profileLoading) {
    return (
      <div dir="rtl" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Skeleton className="h-40 w-full rounded-2xl sm:h-52" />
        <div className="-mt-12 flex flex-col items-center gap-3 px-4 sm:flex-row sm:items-end">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2 pb-2 text-center sm:text-right">
            <Skeleton className="mx-auto h-7 w-48 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div dir="rtl" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <Users className="mb-4 h-12 w-12 opacity-40" />
          <p>המשתמש לא נמצא.</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Cover */}
      <div className="relative">
        <div
          className={cn(
            "relative h-40 w-full overflow-hidden rounded-2xl sm:h-52",
            !coverUrl && "xp-gradient"
          )}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tl from-primary/30 via-transparent to-primary/10" />
          )}

          {isSelf && myId && (
            <div className="absolute left-3 top-3 z-10">
              <CoverImageUpload
                userId={myId}
                onImageUpdate={(url) => setCoverUrl(url)}
              />
            </div>
          )}
        </div>

        {/* Header row */}
        <div className="-mt-12 flex flex-col items-center gap-4 px-2 sm:-mt-14 sm:flex-row sm:items-end sm:px-4">
          <div className="relative shrink-0">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-card ring-4 ring-background">
              <Avatar className="h-full w-full rounded-full">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-2xl font-heading text-primary">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {isSelf && avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              )}
            </div>

            {isSelf && myId && (
              <>
                <Button
                  type="button"
                  size="icon"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  aria-label="שנה תמונת פרופיל"
                  className="absolute bottom-0 left-0 h-8 w-8 rounded-full border-2 border-background shadow-md"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="flex-1 pb-1 text-center sm:text-right">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {displayName}
              </h1>
              <LevelChip level={levelInfo.level} />
              <span className="text-sm text-muted-foreground">
                {levelTitle(levelInfo.level)}
              </span>
            </div>
            {profile.headline && (
              <p className="mt-1 text-sm text-muted-foreground">{profile.headline}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-full shrink-0 gap-2 pb-1 sm:w-auto">
            {isSelf ? (
              <>
                <Button onClick={openEdit} className="button-glow gap-2">
                  <Pencil className="h-4 w-4" />
                  עריכת פרופיל
                </Button>
                <RestorePurchasesButton className="gap-2" />
                <Button
                  onClick={logout}
                  variant="outline"
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  התנתקות
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() =>
                    targetId &&
                    toggleFollow.mutate({ targetId, isFollowing })
                  }
                  disabled={toggleFollow.isPending || !targetId}
                  variant={isFollowing ? "secondary" : "default"}
                  className={cn(
                    "flex-1 gap-2 sm:flex-none",
                    isFollowing
                      ? "border border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
                      : "button-glow"
                  )}
                >
                  {isFollowing ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {isFollowing ? "עוקב/ת" : "עקוב"}
                </Button>
                <Button variant="secondary" asChild className="flex-1 gap-2 sm:flex-none">
                  <Link to={`/messages?to=${targetId}`}>
                    <MessageSquare className="h-4 w-4" />
                    הודעה
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Level progress bar */}
      <Card className="glass-card mt-6">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-heading font-semibold text-foreground">
              רמה {levelInfo.level}
            </span>
            <span className="text-muted-foreground">
              {levelInfo.xpToNext > 0
                ? `עוד ${levelInfo.xpToNext.toLocaleString()} XP לרמה הבאה`
                : "ברמה המקסימלית"}
            </span>
          </div>
          <Progress value={levelInfo.progressPct} className="h-2.5" />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground/70">
            <span>{levelInfo.xpIntoLevel.toLocaleString()} XP</span>
            <span>{levelInfo.levelSpan.toLocaleString()} XP</span>
          </div>
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Zap} label="XP" value={(profile.xp_total ?? 0).toLocaleString()} accent />
        <StatTile icon={Star} label="רמה" value={levelInfo.level} />
        <StatTile
          icon={Flame}
          label="רצף"
          value={profile.current_streak ?? 0}
          sub={profile.longest_streak ? `שיא ${profile.longest_streak}` : undefined}
        />
        <StatTile
          icon={Users}
          label="עוקבים"
          value={isSelf ? selfFollowers : followers}
        />
        <StatTile
          icon={UserPlus}
          label="נעקבים"
          value={isSelf ? selfFollowing : following}
        />
        <StatTile icon={Award} label="תגים" value={badgeItems.length} />
      </div>

      {/* Badges */}
      <Card className="glass-card mt-4">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">תגים שהושגו</h2>
          </div>
          <BadgeGrid
            badges={badgeItems}
            emptyText={
              isSelf
                ? "עדיין אין תגים — הזמן להתחיל לאסוף 🏆"
                : "למשתמש זה עדיין אין תגים"
            }
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="mt-6 w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="progress" className="gap-2 px-2.5 sm:px-4">
            <BookOpen className="h-4 w-4" />
            התקדמות
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-2 px-2.5 sm:px-4">
            <MessageSquare className="h-4 w-4" />
            פוסטים
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2 px-2.5 sm:px-4">
            <Users className="h-4 w-4" />
            אודות
          </TabsTrigger>
        </TabsList>

        {/* Progress */}
        <TabsContent value="progress" className="mt-4">
          {modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((module) => {
                const progress = getModuleProgress(module.id);
                return (
                  <Card key={module.id} className="interactive-card">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="font-heading font-semibold text-foreground">
                          {module.title}
                        </h4>
                        <span className="shrink-0 text-sm font-medium text-primary">
                          {progress}%
                        </span>
                      </div>
                      {module.description && (
                        <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      )}
                      <Progress value={progress} className="h-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BookOpen className="mb-4 h-12 w-12 opacity-40" />
              <p>אין קורסים להצגה.</p>
            </div>
          )}
        </TabsContent>

        {/* Posts */}
        <TabsContent value="posts" className="mt-4">
          {postsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {post.type}
                      </span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {post.content}
                    </p>
                    {post.images?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {post.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="aspect-video w-full rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        {post.like_count} לייקים
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comment_count} תגובות
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquare className="mb-4 h-12 w-12 opacity-40" />
              <p>{isSelf ? "עדיין לא פרסמת פוסטים" : "אין פוסטים להצגה"}</p>
            </div>
          )}
        </TabsContent>

        {/* About */}
        <TabsContent value="about" className="mt-4">
          <Card className="glass-card">
            <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-5">
              <div>
                <h3 className="mb-1.5 font-heading text-sm font-semibold text-muted-foreground">
                  אודות
                </h3>
                {profile.bio ? (
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">לא נוספה ביוגרפיה.</p>
                )}
              </div>

              {links.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 font-heading text-sm font-semibold text-muted-foreground">
                      קישורים
                    </h3>
                    <div className="flex flex-col gap-2">
                      {links.map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Link2 className="h-4 w-4" />
                          {l.label || l.url}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {joinedAt && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    הצטרף/ה ב{joinedAt}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* My Certificates (self only) */}
      {isSelf && myCertificates.length > 0 && (
        <Card className="glass-card mt-4">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold">התעודות שלי</h2>
            </div>
            <div className="space-y-2">
              {myCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {(cert.modules as any)?.title ?? 'קורס'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(cert.issued_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  {cert.certificate_url && (
                    <a
                      href={cert.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Award className="h-4 w-4" />
                      פתח תעודה
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit dialog (self only) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl" className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle className="font-heading">עריכת פרופיל</DialogTitle>
            <DialogDescription>
              עדכן/י את פרטי הפרופיל שלך. השינויים יוצגו לכל המשתמשים.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>תמונת פרופיל</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Avatar className="h-16 w-16 ring-2 ring-border">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 font-heading text-primary">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {avatarUrl ? "שנה תמונה" : "העלה תמונה"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={avatarUploading}
                    >
                      הסר תמונה
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">שם מלא</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="השם שלך"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name_en">שם באנגלית (לתעודה)</Label>
              <Input
                id="full_name_en"
                value={form.full_name_en}
                onChange={(e) => setForm((f) => ({ ...f, full_name_en: e.target.value }))}
                placeholder="Your name in English"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">כותרת</Label>
              <Input
                id="headline"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="לדוגמה: סטודנט/ית לפיתוח"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">אודות</Label>
              <Textarea
                id="bio"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="ספר/י קצת על עצמך..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image_url">תמונת רקע (קישור)</Label>
              <Input
                id="cover_image_url"
                value={form.cover_image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cover_image_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="links">קישורים</Label>
              <Textarea
                id="links"
                rows={3}
                value={form.linksText}
                onChange={(e) => setForm((f) => ({ ...f, linksText: e.target.value }))}
                placeholder="שורה לכל קישור — תווית | כתובת"
              />
              <p className="text-xs text-muted-foreground/70">
                שורה לכל קישור בפורמט: תווית | https://...
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving} className="button-glow gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "שומר..." : "שמירה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
