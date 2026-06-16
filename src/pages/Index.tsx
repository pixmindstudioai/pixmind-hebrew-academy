import { useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Star,
  Users,
  Trophy,
  LogIn,
  UserPlus,
  Zap,
  Flame,
  Medal,
  Award,
  PlayCircle,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ModuleCard from "@/components/shared/ModuleCard";
import { isNativeIOSApp } from "@/lib/platform";
import { useAuth } from "@/hooks/useAuth";
import { useVerifiedModules, useUserProgress } from "@/hooks/useContentData";
import { useModuleAccess } from "@/hooks/useUserModuleAccess";
import { useMyProfile, useEarnedBadges } from "@/hooks/useGamification";
import { useLeaderboard } from "@/hooks/useProfiles";
import { useFeed } from "@/hooks/useFeed";
import { supabase } from "@/integrations/supabase/client";
import {
  LevelMeter,
  ProgressRing,
  StatTile,
  LeaderboardList,
  BadgeGrid,
  type BadgeItem,
} from "@/components/gamification";
import heroBackground from "@/assets/hero-background.jpg";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Dashboard data: all active lessons (with module) for completion %   */
/* ------------------------------------------------------------------ */

interface DashboardLesson {
  id: string;
  title: string;
  order_index: number;
  module_id: string;
  module_title: string;
  module_order: number;
  chapter_order: number;
}

/** Flat list of every active lesson the catalogue exposes, ordered for "next up". */
function useActiveLessons() {
  return useQuery({
    queryKey: ["dashboard-active-lessons"],
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<DashboardLesson[]> => {
      const { data, error } = await supabase
        .from("lessons")
        .select(
          "id, title, order_index, chapters!inner(order_index, status, module_id, modules!inner(id, title, order_index, status))"
        )
        .eq("status", "active")
        .eq("chapters.status", "active")
        .eq("chapters.modules.status", "active")
        .order("order_index");

      if (error) return [];
      const rows = (data ?? []) as any[];
      const mapped: DashboardLesson[] = rows
        .map((r) => {
          const chapter = r.chapters;
          const module = chapter?.modules;
          if (!chapter || !module) return null;
          return {
            id: r.id,
            title: r.title,
            order_index: r.order_index ?? 0,
            module_id: module.id,
            module_title: module.title,
            module_order: module.order_index ?? 0,
            chapter_order: chapter.order_index ?? 0,
          } as DashboardLesson;
        })
        .filter(Boolean) as DashboardLesson[];

      // Course-flow ordering: module → chapter → lesson.
      return mapped.sort(
        (a, b) =>
          a.module_order - b.module_order ||
          a.chapter_order - b.chapter_order ||
          a.order_index - b.order_index
      );
    },
  });
}

function firstName(full?: string | null) {
  if (!full) return "חבר";
  return full.trim().split(/\s+/)[0] || "חבר";
}

/* ------------------------------------------------------------------ */
/*  Member dashboard (authenticated)                                    */
/* ------------------------------------------------------------------ */

const MemberDashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: badges = [] } = useEarnedBadges();
  const { data: leaders = [], isLoading: leadersLoading } = useLeaderboard(5);
  const { data: feed = [] } = useFeed();
  const { data: lessons = [], isLoading: lessonsLoading } = useActiveLessons();
  const { data: progress = [] } = useUserProgress(user?.id);

  // Completed lesson ids from the user's progress rows.
  const completedIds = useMemo(() => {
    const set = new Set<string>();
    (progress as Array<{ completed?: boolean | null; lesson_id?: string | null }>).forEach(
      (p) => {
        if (p?.completed && p?.lesson_id) set.add(p.lesson_id);
      }
    );
    return set;
  }, [progress]);

  const totalLessons = lessons.length;
  const completedCount = useMemo(
    () => lessons.filter((l) => completedIds.has(l.id)).length,
    [lessons, completedIds]
  );
  const overallPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Next incomplete lesson in course order.
  const nextLesson = useMemo(
    () => lessons.find((l) => !completedIds.has(l.id)) ?? null,
    [lessons, completedIds]
  );

  // Distinct modules the member has touched but not yet finished.
  const inProgressModules = useMemo(() => {
    const byModule = new Map<string, { total: number; done: number }>();
    lessons.forEach((l) => {
      const m = byModule.get(l.module_id) ?? { total: 0, done: 0 };
      m.total += 1;
      if (completedIds.has(l.id)) m.done += 1;
      byModule.set(l.module_id, m);
    });
    let count = 0;
    byModule.forEach(({ total, done }) => {
      if (done > 0 && done < total) count += 1;
    });
    return count;
  }, [lessons, completedIds]);

  const badgeItems: BadgeItem[] = useMemo(
    () =>
      badges.slice(0, 12).map((b) => ({
        code: b.code,
        name: b.name,
        description: b.description,
        icon: b.icon,
        tier: b.tier,
        earned: true,
      })),
    [badges]
  );

  const recentPosts = feed.slice(0, 3);

  if (profileLoading || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6" dir="rtl">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const name = firstName(profile.full_name);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6" dir="rtl">
      {/* Hero */}
      <div className="glass-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              שלום, {name} <span className="align-middle">👋</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextLesson
                ? "ממשיכים מאיפה שעצרת — כל שיעור מקרב אותך לרמה הבאה."
                : overallPct === 100 && totalLessons > 0
                  ? "סיימת את כל השיעורים! כל הכבוד 🎉"
                  : "ברוך הבא חזרה לאקדמיה."}
            </p>
            <div className="mt-5 max-w-md">
              <LevelMeter levelInfo={profile.levelInfo} />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 self-center">
            <ProgressRing value={overallPct} size={120} strokeWidth={10}>
              <span className="font-heading text-3xl font-bold text-foreground">
                {overallPct}%
              </span>
              <span className="text-[11px] text-muted-foreground">השלמת הקורסים</span>
            </ProgressRing>
            {totalLessons > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedCount} / {totalLessons} שיעורים
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Zap} label="XP" value={profile.xp_total.toLocaleString()} accent />
        <StatTile icon={Star} label="רמה" value={profile.level} sub={profile.title} />
        <StatTile icon={Flame} label="רצף" value={`${profile.current_streak} ימים`} />
        <StatTile icon={Medal} label="תגים" value={badges.length} />
        <StatTile
          icon={GraduationCap}
          label="קורסים בתהליך"
          value={inProgressModules}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Continue learning */}
      <Card className="interactive-card mt-6 border-border/40 overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-primary">
                המשך ללמוד
              </div>
              {lessonsLoading ? (
                <Skeleton className="mt-1.5 h-5 w-48" />
              ) : nextLesson ? (
                <>
                  <div className="mt-0.5 truncate font-heading text-lg font-semibold text-foreground">
                    {nextLesson.title}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {nextLesson.module_title}
                  </div>
                </>
              ) : (
                <div className="mt-0.5 font-heading text-lg font-semibold text-foreground">
                  {totalLessons > 0 ? "השלמת את כל השיעורים! 🎉" : "אין שיעורים זמינים עדיין"}
                </div>
              )}
            </div>
          </div>

          <Button asChild size="lg" variant="hero" className="button-glow shrink-0">
            {nextLesson ? (
              <Link to={`/lesson/${nextLesson.id}`}>
                {completedCount > 0 ? "המשך לשיעור" : "התחל ללמוד"}
                <ArrowLeft className="h-5 w-5" />
              </Link>
            ) : (
              <Link to="/courses">
                לכל הקורסים
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Two-column: leaderboard + badges/community */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <Trophy className="h-5 w-5 text-xp" />
                טבלת הדירוג
              </h2>
              <Link
                to="/leaderboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                כל הדירוג ←
              </Link>
            </div>
            {leadersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : leaders.length > 0 ? (
              <LeaderboardList profiles={leaders} meId={profile.id} max={5} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                הדירוג עדיין ריק — היה הראשון לצבור XP 🚀
              </p>
            )}
          </CardContent>
        </Card>

        {/* Badges (or community teaser fallback) */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            {badgeItems.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    התגים שלך
                  </h2>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    הפרופיל שלי ←
                  </Link>
                </div>
                <BadgeGrid badges={badgeItems} />
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    קהילה
                  </h2>
                  <Link
                    to="/feed"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    לקהילה ←
                  </Link>
                </div>
                {recentPosts.length > 0 ? (
                  <div className="space-y-3">
                    {recentPosts.map((post) => (
                      <Link
                        key={post.id}
                        to="/feed"
                        className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={post.author?.profile_picture_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(post.author?.full_name || "?").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {post.author?.full_name || "חבר/ה"}
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {post.content}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    עדיין אין פוסטים בקהילה — בוא תפתח את השיח 💬
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Public marketing landing (logged-out)                               */
/* ------------------------------------------------------------------ */

const MarketingLanding = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: modules = [], isLoading: modulesLoading } = useVerifiedModules();
  const { canAccessModule, userAccess } = useModuleAccess();

  // Filter modules to hide those with is_hidden unless user has access
  const visibleModules = modules.filter((module) => {
    if (!module.is_hidden) return true;
    return userAccess.some((access) => access.module_id === module.id);
  });

  const handleModuleClick = (module: any) => {
    if (!canAccessModule(module)) {
      // App is view-only — open the (gated) course page, never an external purchase link.
      if (isNativeIOSApp()) {
        window.location.href = `/courses/${module.id}`;
      } else if (module.payment_url) {
        window.open(module.payment_url, "_blank");
      } else {
        toast.error("מודול זה בתשלום. אין לך גישה.");
      }
      return;
    }
    window.location.href = `/courses/${module.id}`;
  };

  const stats = [
    { icon: Users, label: "תלמידים רשומים", value: "15,000+" },
    { icon: BookOpen, label: "קורסים זמינים", value: "50+" },
    { icon: Play, label: "שיעורי וידאו", value: "800+" },
    { icon: Trophy, label: "תלמידים שסיימו", value: "5,000+" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-8 animate-fade-in text-balance">
            <span className="gradient-text">אקדמיית</span>
            <br />
            <span className="text-foreground">PixMind Studio</span>
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            {isAuthenticated ? (
              <>
                שלום {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(" ")[0] : "חבר"}!
                <br />
                המשך את המסע שלך בלימוד עם המערכת המתקדמת שלנו
              </>
            ) : (
              <>
                פלטפורמת הלימוד המתקדמת ביותר
                <br />
                עם מערכת מודולרית, נגן וידאו מותאם אישית, ומעקב התקדמות
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
            {isAuthenticated ? (
              <>
                <Button asChild size="xl" variant="hero">
                  <Link to="/courses">
                    המשך ללמוד
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>

                <Button asChild size="xl" variant="outline">
                  <Link to="/courses">גלה קורסים נוספים</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="xl" variant="hero">
                  <Link to="/signup">
                    <UserPlus className="w-5 h-5" />
                    הרשם בחינם עכשיו
                  </Link>
                </Button>

                <Button asChild size="xl" variant="outline">
                  <Link to="/login">
                    <LogIn className="w-5 h-5" />
                    כבר יש לך חשבון? התחבר
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-card border-y border-border/30">
        <div className="section-container">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center interactive-card border-border/40">
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold mb-1 text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-14 sm:py-20 lg:py-24">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 gradient-text">
              הקורסים הפופולריים
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              בחר מבין הקורסים המובילים שלנו והתחל את המסע שלך
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {modulesLoading ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                טוען קורסים...
              </div>
            ) : visibleModules.length > 0 ? (
              visibleModules.slice(0, 6).map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  lessonsCount={0}
                  onClick={handleModuleClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-lg font-medium mb-2">אין קורסים זמינים כרגע</p>
                <p className="text-sm">חזרו אלינו בקרוב לקורסים חדשים ומרתקים</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/courses">
                צפה בכל הקורסים
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-20 lg:py-24 bg-card border-y border-border/30">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 gradient-text">
              למה לבחור בנו?
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              הטכנולוגיה המתקדמת ביותר לשירותך
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="interactive-card">
              <CardContent className="p-5 sm:p-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">מבנה מודולרי</h3>
                <p className="text-muted-foreground leading-relaxed">
                  מערכת לימוד מתקדמת המחולקת למודולים, פרקים ושיעורים לחוויית למידה מיטבית
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card">
              <CardContent className="p-5 sm:p-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6">
                  <Play className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">נגן וידאו מתקדם</h3>
                <p className="text-muted-foreground leading-relaxed">
                  נגן וידאו מותאם אישית עם פקדים נוחים, כתוביות ומהירות השמעה משתנה
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card">
              <CardContent className="p-5 sm:p-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6">
                  <Star className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">מעקב התקדמות</h3>
                <p className="text-muted-foreground leading-relaxed">
                  מעקב מדויק אחר ההתקדמות שלך בכל רמה - שיעור, פרק ומודול
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6" dir="rtl">
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  return isAuthenticated ? <MemberDashboard /> : <MarketingLanding />;
};

export default Index;
