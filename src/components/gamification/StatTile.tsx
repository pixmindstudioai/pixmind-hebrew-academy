import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  className?: string;
}

/** Compact metric tile used across the dashboard & profile. */
export function StatTile({ icon: Icon, label, value, sub, accent, className }: StatTileProps) {
  return (
    <div className={cn("stat-tile", className)}>
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
          accent ? "xp-gradient text-primary-foreground" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-heading text-2xl font-bold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground/70">{sub}</div>}
    </div>
  );
}
