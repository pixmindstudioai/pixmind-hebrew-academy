import { Link } from "react-router-dom";
import { Crown, Medal, Trophy, Zap } from "lucide-react";

import { useLeaderboard, type PublicProfile } from "@/hooks/useProfiles";
import { useMyProfile } from "@/hooks/useGamification";
import { levelTitle } from "@/lib/levels";
import { cn } from "@/lib/utils";

import { LeaderboardRow, ProgressRing } from "@/components/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function initials(name?: string | null) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Per-podium-place styling: 1=cyan, 2=silver, 3=amber. */
const PODIUM = [
  {
    ring: "from-primary/30 via-primary/10 to-transparent",
    border: "ring-primary/40",
    text: "text-primary",
    Icon: Crown,
    badge: "bg-primary/15 text-primary",
    label: "ראשון",
    avatar: 80,
    ringSize: 90,
    avatarClass: "h-14 w-14 sm:h-20 sm:w-20",
    glow: "glow-cyan",
  },
  {
    ring: "from-slate-300/25 via-slate-300/5 to-transparent",
    border: "ring-slate-300/40",
    text: "text-slate-300",
    Icon: Medal,
    badge: "bg-slate-300/15 text-slate-200",
    label: "שני",
    avatar: 64,
    ringSize: 74,
    avatarClass: "h-12 w-12 sm:h-16 sm:w-16",
    glow: "",
  },
  {
    ring: "from-amber-500/25 via-amber-500/5 to-transparent",
    border: "ring-amber-500/40",
    text: "text-amber-500",
    Icon: Medal,
    badge: "bg-amber-500/15 text-amber-500",
    label: "שלישי",
    avatar: 64,
    ringSize: 74,
    avatarClass: "h-12 w-12 sm:h-16 sm:w-16",
    glow: "",
  },
] as const;

function PodiumCard({
  profile,
  place,
  highlight,
}: {
  profile: PublicProfile;
  place: 0 | 1 | 2;
  highlight?: boolean;
}) {
  const s = PODIUM[place];
  const xp = profile.xp_total ?? 0;
  const level = profile.level ?? 1;

  return (
    <Link
      to={`/profile/${profile.id}`}
      className={cn(
        "glass-card interactive-card relative flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center ring-1 sm:px-3 sm:py-5",
        s.border,
        place === 0 && "sm:-mt-4",
        s.glow,
        highlight && "ring-2 ring-primary"
      )}
    >
      {/* rank pill */}
      <div
        className={cn(
          "absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full font-heading text-sm font-bold ring-1 ring-border",
          s.badge
        )}
      >
        {place + 1}
      </div>

      <div
        className={cn(
          "rounded-full bg-gradient-to-b p-1",
          s.ring
        )}
      >
        <ProgressRing value={100} size={s.ringSize} strokeWidth={4}>
          <Avatar className={s.avatarClass}>
            <AvatarImage src={profile.profile_picture_url ?? undefined} />
            <AvatarFallback className="text-lg font-semibold">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
        </ProgressRing>
      </div>

      <s.Icon className={cn("h-5 w-5", s.text)} />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">
          {profile.full_name || "חבר/ה"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          רמה {level} · {levelTitle(level)}
        </div>
      </div>

      <div className={cn("flex items-center gap-1 font-heading text-base font-bold", s.text)}>
        <Zap className="h-4 w-4 fill-current" />
        {xp.toLocaleString()}
      </div>
    </Link>
  );
}

function PageHeader() {
  return (
    <header className="mb-6 text-center sm:text-right">
      <h1 className="gradient-text font-heading text-2xl font-bold sm:text-3xl">טבלת המובילים</h1>
      <p className="mt-1 text-sm text-muted-foreground">מי צובר הכי הרבה XP</p>
    </header>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6" dir="rtl">
      <PageHeader />
      <div className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card flex flex-col items-center gap-2 rounded-2xl px-2 py-4 sm:px-3 sm:py-5">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: profiles, isLoading } = useLeaderboard(50);
  const { data: me } = useMyProfile();
  const myId = me?.id;

  if (isLoading) return <LeaderboardSkeleton />;

  const list = profiles ?? [];

  if (list.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6" dir="rtl">
        <PageHeader />
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/60" />
            <p className="text-base font-medium text-foreground">הטבלה עדיין ריקה</p>
            <p className="text-sm text-muted-foreground">
              השלימו שיעורים וצברו XP כדי להופיע כאן ראשונים
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  // My rank within the top-50 list (1-based), if present.
  const myIndex = myId ? list.findIndex((p) => p.id === myId) : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  // Visual podium order: 2nd · 1st · 3rd (1st centered & raised).
  const podiumOrder: Array<{ profile: PublicProfile; place: 0 | 1 | 2 }> = [];
  if (top3[1]) podiumOrder.push({ profile: top3[1], place: 1 });
  if (top3[0]) podiumOrder.push({ profile: top3[0], place: 0 });
  if (top3[2]) podiumOrder.push({ profile: top3[2], place: 2 });

  const myXp = me?.xp_total ?? 0;
  const myLevel = me?.level ?? 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6" dir="rtl">
      <PageHeader />

      {/* Podium */}
      <section className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-3">
        {podiumOrder.map(({ profile, place }) => (
          <PodiumCard
            key={profile.id}
            profile={profile}
            place={place}
            highlight={profile.id === myId}
          />
        ))}
      </section>

      {/* My place summary */}
      {me && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                המקום שלך
              </span>
              <span className="font-heading text-2xl font-bold text-primary">
                {myRank ? `#${myRank}` : "—"}
              </span>
            </div>
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={me.profile_picture_url ?? undefined} />
              <AvatarFallback>{initials(me.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {me.full_name || "אני"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                רמה {myLevel} · {levelTitle(myLevel)}
                {!myRank && " · עדיין לא בעשירייה הפותחת"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 font-heading text-base font-bold text-xp">
              <Zap className="h-4 w-4 fill-current" />
              {myXp.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranks 4+ */}
      {rest.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-2 sm:p-3">
            <div className="space-y-0.5">
              {rest.map((p, i) => (
                <LeaderboardRow
                  key={p.id}
                  profile={p}
                  rank={i + 4}
                  highlight={p.id === myId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
