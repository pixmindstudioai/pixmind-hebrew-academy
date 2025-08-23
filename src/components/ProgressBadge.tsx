import { CheckCircle, Clock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBadgeProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const ProgressBadge = ({ 
  percentage, 
  size = "md", 
  showIcon = true,
  className 
}: ProgressBadgeProps) => {
  const isCompleted = percentage >= 100;
  const isStarted = percentage > 0;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  const getVariant = () => {
    if (isCompleted) return "completed";
    if (isStarted) return "in-progress";
    return "not-started";
  };

  const variantClasses = {
    completed: "bg-success/10 text-success border-success/20",
    "in-progress": "bg-primary/10 text-primary border-primary/20",
    "not-started": "bg-muted text-muted-foreground border-border"
  };

  const getIcon = () => {
    if (isCompleted) return Trophy;
    if (isStarted) return Clock;
    return Clock;
  };

  const Icon = getIcon();
  const variant = getVariant();

  return (
    <div className={cn(
      "inline-flex items-center space-x-1.5 space-x-reverse rounded-full border font-medium transition-all duration-200",
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {showIcon && (
        <Icon className={iconSizes[size]} />
      )}
      <span>
        {isCompleted ? "הושלם" : `${Math.round(percentage)}%`}
      </span>
    </div>
  );
};

export default ProgressBadge;