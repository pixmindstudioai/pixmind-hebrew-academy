import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { XpChip, LevelChip, StreakChip } from "@/components/gamification";
import { MemberSearch } from "./MemberSearch";
import { useMyProfile } from "@/hooks/useGamification";
import { memberNav, isActivePath } from "./navItems";

function initials(name?: string | null) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function TopBar() {
  const { data: profile } = useMyProfile();
  const location = useLocation();
  const current = memberNav.find((n) => isActivePath(location.pathname, n.href));

  const xp = profile?.xp_total ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.current_streak ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile brand */}
        <Link to="/" className="lg:hidden">
          <img src="/logo.png" alt="PixMind" className="h-8 w-auto" />
        </Link>

        {/* Page title (desktop) */}
        {current && (
          <h1 className="hidden font-heading text-lg font-bold text-foreground lg:block">{current.label}</h1>
        )}

        {/* Search (desktop) */}
        <MemberSearch className="mr-2 hidden flex-1 lg:block lg:max-w-xs" />

        <div className="mr-auto flex items-center gap-2 lg:mr-0">
          {/* XP / Level / Streak chips */}
          <div className="hidden items-center gap-2 sm:flex">
            <XpChip xp={xp} />
            <LevelChip level={level} />
            <StreakChip days={streak} />
          </div>
          {/* Compact XP chip on small screens */}
          <div className="sm:hidden">
            <XpChip xp={xp} />
          </div>

          <Button asChild variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground" title="התראות">
            <Link to="/announcements">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>

          <Link to="/profile" className="shrink-0">
            <Avatar className="h-9 w-9 ring-2 ring-primary/30 transition hover:ring-primary/60">
              <AvatarImage src={profile?.profile_picture_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials(profile?.full_name)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
