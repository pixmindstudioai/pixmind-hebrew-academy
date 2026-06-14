import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

export type ChallengeStatus = "approved" | "pending" | "rejected" | "none";

interface ChallengeCardProps {
  taskId: string;
  lessonTitle: string;
  chapterTitle?: string;
  moduleTitle?: string;
  xpReward: number;
  status: ChallengeStatus;
  isMandatory?: boolean;
  submittedAt?: string | null;
}

const STATUS_CONFIG: Record<
  ChallengeStatus,
  { label: string; icon: typeof CheckCircle; className: string; cta: string }
> = {
  approved: {
    label: "אושר",
    icon: CheckCircle,
    className: "border-success/40 bg-success/10 text-success",
    cta: "צפה במשימה",
  },
  pending: {
    label: "בבדיקה",
    icon: Clock,
    className: "border-primary/40 bg-primary/10 text-primary",
    cta: "צפה בהגשה",
  },
  rejected: {
    label: "נדחה",
    icon: XCircle,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    cta: "הגש מחדש",
  },
  none: {
    label: "פתוח",
    icon: Zap,
    className: "border-border bg-muted/40 text-muted-foreground",
    cta: "התחל אתגר",
  },
};

export function ChallengeCard({
  taskId,
  lessonTitle,
  chapterTitle,
  moduleTitle,
  xpReward,
  status,
  isMandatory,
  submittedAt,
}: ChallengeCardProps) {
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const isDone = status === "approved";

  return (
    <Link
      to={`/tasks/${taskId}`}
      className={cn(
        "glass-card interactive-card group relative flex flex-col gap-4 overflow-hidden p-5",
        isDone && "ring-1 ring-success/30"
      )}
    >
      {/* glow accent line */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          isDone ? "bg-success/60" : "bg-gradient-primary"
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span className="line-clamp-1">{moduleTitle || "ללא קורס"}</span>
        </div>

        {/* XP reward pill */}
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Zap className="h-3.5 w-3.5 fill-current" />
          +{xpReward} XP
        </span>
      </div>

      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-heading text-base font-bold leading-snug text-foreground line-clamp-2">
            {lessonTitle}
          </h3>
        </div>
        {chapterTitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">{chapterTitle}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isMandatory && (
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              חובה
            </Badge>
          )}
          {submittedAt && (
            <span className="text-[11px] text-muted-foreground/70">
              הוגש: {new Date(submittedAt).toLocaleDateString("he-IL")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            cfg.className
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {cfg.label}
        </span>

        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:-translate-x-0.5">
          {cfg.cta}
          <ArrowLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default ChallengeCard;
