import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { LevelInfo } from "@/lib/levels";
import { levelTitle } from "@/lib/levels";

interface LevelMeterProps {
  levelInfo: LevelInfo;
  title?: string;
  compact?: boolean;
  className?: string;
}

/** The headline XP/level meter: level badge + animated XP bar + "to next" hint. */
export function LevelMeter({ levelInfo, title, compact, className }: LevelMeterProps) {
  const t = title ?? levelTitle(levelInfo.level);
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="xp-gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold text-primary-foreground shadow-primary">
            {levelInfo.level}
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-heading text-sm font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 text-xp" />
              רמה {levelInfo.level} · {t}
            </div>
            {!compact && (
              <div className="text-xs text-muted-foreground">
                {levelInfo.xp.toLocaleString()} XP סה״כ
              </div>
            )}
          </div>
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-xp">{levelInfo.progressPct}%</div>
          {!compact && (
            <div className="text-[11px] text-muted-foreground">עוד {levelInfo.xpToNext} XP</div>
          )}
        </div>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="xp-gradient absolute inset-y-0 right-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${levelInfo.progressPct}%` }}
        />
      </div>

      {!compact && (
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>{levelInfo.xpIntoLevel} / {levelInfo.levelSpan} XP ברמה</span>
          <span>רמה {levelInfo.level + 1} ←</span>
        </div>
      )}
    </div>
  );
}
