import { cn } from "@/lib/utils";
import { getIcon } from "./icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Tier = "bronze" | "silver" | "gold" | "special" | string;

const tierClass = (tier: Tier) =>
  ({
    bronze: "tier-bronze",
    silver: "tier-silver",
    gold: "tier-gold",
    special: "tier-special",
  } as Record<string, string>)[tier] ?? "tier-bronze";

export interface BadgeItem {
  code?: string;
  name: string;
  description?: string | null;
  icon: string;
  tier: Tier;
  earned?: boolean;
}

/** A single circular badge medallion. */
export function BadgeMedallion({ badge, size = 56 }: { badge: BadgeItem; size?: number }) {
  const Icon = getIcon(badge.icon);
  const earned = badge.earned !== false;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl border-2 transition-all",
              earned ? cn(tierClass(badge.tier), "animate-float") : "border-border bg-muted/40 text-muted-foreground grayscale opacity-50"
            )}
            style={{ width: size, height: size }}
          >
            <Icon style={{ width: size * 0.42, height: size * 0.42 }} />
          </div>
          <span className={cn("max-w-[80px] truncate text-xs font-medium", earned ? "text-foreground" : "text-muted-foreground")}>
            {badge.name}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-right">
          <div className="font-semibold">{badge.name}</div>
          {badge.description && <div className="text-xs text-muted-foreground">{badge.description}</div>}
          {!earned && <div className="text-xs text-muted-foreground/70">עדיין לא הושג</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** A small inline badge pill (for cards / lists). */
export function BadgePill({ badge }: { badge: BadgeItem }) {
  const Icon = getIcon(badge.icon);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", tierClass(badge.tier))}>
      <Icon className="h-3.5 w-3.5" />
      {badge.name}
    </span>
  );
}

/** Grid of badges (earned + optional locked). */
export function BadgeGrid({ badges, emptyText = "עדיין אין תגים — הזמן להתחיל לאסוף 🏆" }: { badges: BadgeItem[]; emptyText?: string }) {
  if (!badges.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6">
      {badges.map((b, i) => (
        <BadgeMedallion key={b.code ?? i} badge={b} />
      ))}
    </div>
  );
}
