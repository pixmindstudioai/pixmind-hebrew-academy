import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { memberNav, isActivePath } from "./navItems";
import { useMyProfile } from "@/hooks/useGamification";
import { levelTitle } from "@/lib/levels";

function initials(name?: string | null) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-border/60 bg-sidebar md:flex pt-[env(safe-area-inset-top)]">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <img src="/logo.png" alt="PixMind Studio Academy" className="h-9 w-auto" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-hide">
        {memberNav.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(location.pathname, href);
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] transition-transform group-hover:scale-110", active && "text-primary")} />
              <span>{label}</span>
              {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.profile_picture_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-foreground">{profile?.full_name || "חבר/ה"}</div>
            <div className="truncate text-xs text-muted-foreground">
              רמה {profile?.level ?? 1} · {levelTitle(profile?.level ?? 1)}
            </div>
          </div>
          <Button onClick={logout} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="התנתקות">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
