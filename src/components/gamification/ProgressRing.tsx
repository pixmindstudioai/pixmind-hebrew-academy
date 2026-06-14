import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ProgressRingProps {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  children?: ReactNode;
}

/** Cyan circular progress ring with a centred slot. */
export function ProgressRing({
  value,
  size = 88,
  strokeWidth = 8,
  className,
  trackClassName,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn("fill-none stroke-muted/60", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="url(#ring-cyan)"
          className="fill-none transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
        <defs>
          <linearGradient id="ring-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(191 97% 47%)" />
            <stop offset="100%" stopColor="hsl(186 95% 62%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
