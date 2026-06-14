import { Link } from "react-router-dom";
import {
  Users,
  Zap,
  Award,
  MessageCircle,
  Clock,
  Sparkles,
  Trophy,
  ShieldCheck,
  GraduationCap,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile, LeaderboardList } from "@/components/gamification";
import { useGamificationStats } from "@/hooks/useGamificationStats";

const QUICK_LINKS: {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    to: "/admin/badges",
    label: "תגים",
    desc: "ניהול והענקת תגים",
    icon: Award,
  },
  {
    to: "/admin/feed-moderation",
    label: "מודרציית פיד",
    desc: "ניהול פוסטים בקהילה",
    icon: ShieldCheck,
  },
  {
    to: "/admin/task-review",
    label: "בדיקת משימות",
    desc: "אישור הגשות תלמידים",
    icon: MessageCircle,
  },
  {
    to: "/admin/students",
    label: "תלמידים",
    desc: "ניהול חברי האקדמייה",
    icon: GraduationCap,
  },
];

function StatSkeleton() {
  return (
    <div className="stat-tile">
      <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="mt-2 h-4 w-24" />
    </div>
  );
}

const AdminHome = () => {
  const { data, isLoading } = useGamificationStats();

  const stats = data ?? {
    members: 0,
    totalPosts: 0,
    posts24h: 0,
    badgesAwarded: 0,
    activeBadges: 0,
    submissionsPending: 0,
    totalXp: 0,
    topMembers: [],
  };

  const fmt = (n: number) => n.toLocaleString("he-IL");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">דשבורד</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          סקירת האקדמייה
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatTile icon={Users} label="חברים" value={fmt(stats.members)} />
            <StatTile
              icon={Zap}
              label="XP שחולק"
              value={fmt(stats.totalXp)}
              accent
            />
            <StatTile
              icon={Award}
              label="תגים שהוענקו"
              value={fmt(stats.badgesAwarded)}
            />
            <StatTile
              icon={MessageCircle}
              label="פוסטים בקהילה"
              value={fmt(stats.totalPosts)}
            />
            <StatTile
              icon={Clock}
              label="פוסטים ב-24ש"
              value={fmt(stats.posts24h)}
            />
            <StatTile
              icon={Sparkles}
              label="תגים פעילים"
              value={fmt(stats.activeBadges)}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              מובילי האקדמייה
            </CardTitle>
            <Link
              to="/admin/students"
              className="text-sm text-primary hover:underline"
            >
              לכל החברים
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : stats.topMembers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                אין עדיין נתוני דירוג
              </p>
            ) : (
              <LeaderboardList profiles={stats.topMembers} max={5} />
            )}
          </CardContent>
        </Card>

        {/* Pending review highlight */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              ממתין לבדיקה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="font-heading text-4xl font-bold text-foreground">
                {fmt(stats.submissionsPending)}
              </div>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              הגשות משימות הממתינות לאישור
            </p>
            <Link
              to="/admin/task-review"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              למעבר לבדיקה
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/40">
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
