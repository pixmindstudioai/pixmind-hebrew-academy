import { cn } from "@/lib/utils";
import { Zap, Flame, Star } from "lucide-react";

/** Top-bar XP chip. */
export function XpChip({ xp, className }: { xp: number; className?: string }) {
  return (
    <span className={cn("stat-chip stat-chip-xp text-xp", className)} title="נקודות ניסיון">
      <Zap className="h-4 w-4 fill-current" />
      {xp.toLocaleString()}
      <span className="text-[11px] font-medium opacity-70">XP</span>
    </span>
  );
}

/** Top-bar level chip. */
export function LevelChip({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn("stat-chip", className)} title="רמה">
      <Star className="h-4 w-4 text-xp" />
      <span className="text-foreground">רמה {level}</span>
    </span>
  );
}

/** Top-bar streak chip. */
export function StreakChip({ days, className }: { days: number; className?: string }) {
  const active = days > 0;
  return (
    <span
      className={cn("stat-chip", active ? "text-foreground" : "text-muted-foreground", className)}
      title="רצף ימי פעילות"
    >
      <Flame className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
      {days}
    </span>
  );
}
