import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { XpChip, LevelChip, StreakChip } from "@/components/gamification";
import { MemberSearch } from "./MemberSearch";
import { useMyProfile } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { memberNav, isActivePath } from "./navItems";

function initials(name?: string | null) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function TopBar() {
  const { data: profile } = useMyProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const current = memberNav.find((n) => isActivePath(location.pathname, n.href));

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.clear(); // drop user-scoped cache so the next login starts clean
    navigate("/");
  };

  const xp = profile?.xp_total ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.current_streak ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile brand */}
        <Link to="/" className="md:hidden">
          <img src="/logo.png" alt="PixMind" className="h-8 w-auto" />
        </Link>

        {/* Page title (desktop) */}
        {current && (
          <h1 className="hidden font-heading text-lg font-bold text-foreground md:block">{current.label}</h1>
        )}

        {/* Search (desktop) */}
        <MemberSearch className="mr-2 hidden flex-1 md:block md:max-w-xs" />

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

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
              <Avatar className="h-9 w-9 ring-2 ring-primary/30 transition hover:ring-primary/60">
                <AvatarImage src={profile?.profile_picture_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials(profile?.full_name)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate">{profile?.full_name || "חבר/ה"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer gap-2">
                  <User className="h-4 w-4" />
                  הפרופיל שלי
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
