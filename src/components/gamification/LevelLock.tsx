import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

/** "Unlocks at level N" pill — used to gate courses / modules / challenges. */
export function LevelLock({ minLevel, className }: { minLevel: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <Lock className="h-3.5 w-3.5" />
      נפתח ברמה {minLevel}
    </span>
  );
}

/** Helper: is content unlocked for a member level? */
export function isUnlocked(memberLevel: number, minLevel?: number | null, isOpen?: boolean) {
  if (isOpen) return true;
  if (!minLevel || minLevel <= 1) return true;
  return memberLevel >= minLevel;
}
