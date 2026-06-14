import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Zap } from "lucide-react";
import type { PublicProfile } from "@/hooks/useProfiles";
import { levelTitle } from "@/lib/levels";

function initials(name?: string | null) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const rankStyles = [
  "text-xp",                 // 1
  "text-slate-300",          // 2
  "text-amber-600",          // 3
];

export function LeaderboardRow({
  profile,
  rank,
  highlight,
}: {
  profile: PublicProfile;
  rank: number;
  highlight?: boolean;
}) {
  return (
    <Link
      to={`/profile/${profile.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60",
        highlight && "bg-primary/10 ring-1 ring-primary/30"
      )}
    >
      <div className={cn("flex w-7 shrink-0 items-center justify-center font-heading text-sm font-bold", rankStyles[rank - 1] ?? "text-muted-foreground")}>
        {rank === 1 ? <Crown className="h-5 w-5" /> : rank <= 3 ? <Medal className="h-4 w-4" /> : rank}
      </div>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={profile.profile_picture_url ?? undefined} />
        <AvatarFallback className="text-xs">{initials(profile.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{profile.full_name || "חבר/ה"}</div>
        <div className="truncate text-xs text-muted-foreground">רמה {profile.level ?? 1} · {levelTitle(profile.level ?? 1)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-xp">
        <Zap className="h-3.5 w-3.5 fill-current" />
        {(profile.xp_total ?? 0).toLocaleString()}
      </div>
    </Link>
  );
}

/** A compact leaderboard list (used on the home dashboard). */
export function LeaderboardList({
  profiles,
  meId,
  max,
}: {
  profiles: PublicProfile[];
  meId?: string;
  max?: number;
}) {
  const list = max ? profiles.slice(0, max) : profiles;
  return (
    <div className="space-y-0.5">
      {list.map((p, i) => (
        <LeaderboardRow key={p.id} profile={p} rank={i + 1} highlight={p.id === meId} />
      ))}
    </div>
  );
}
