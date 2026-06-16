import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { mobileNav, isActivePath } from "./navItems";

/** Mobile bottom tab bar (Claws-style). */
export function MobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(location.pathname, href);
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
