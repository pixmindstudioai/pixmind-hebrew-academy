import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCompleteLesson } from '@/hooks/useGamification';
import { LESSON_XP } from '@/lib/levels';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProgressToggleProps {
  lessonId: string;
  initialCompleted?: boolean;
  onToggle?: (completed: boolean) => void;
  className?: string;
  /** Show the cyan "+20 XP" reward pill next to the button. */
  showReward?: boolean;
}

const ProgressToggle = ({
  lessonId,
  initialCompleted = false,
  onToggle,
  className = "",
  showReward = true,
}: ProgressToggleProps) => {
  const { user, isAuthenticated } = useAuth();
  const completeLesson = useCompleteLesson();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);

  const isLoading = completeLesson.isPending;

  useEffect(() => {
    setIsCompleted(initialCompleted);
  }, [initialCompleted]);

  const handleToggle = () => {
    if (!isAuthenticated || !user || !lessonId) {
      toast.error('יש להתחבר כדי לסמן שיעורים כהושלמו');
      return;
    }

    const newCompletedState = !isCompleted;

    // Optimistic UI
    setIsCompleted(newCompletedState);
    onToggle?.(newCompletedState);

    // The RPC awards +20 XP (idempotent) and upserts user_progress itself —
    // it toasts the XP on its own, so we don't double-write or double-toast here.
    completeLesson.mutate(
      { lessonId, done: newCompletedState },
      {
        onError: () => {
          // Revert optimistic update on failure
          setIsCompleted(!newCompletedState);
          onToggle?.(!newCompletedState);
        },
        onSuccess: () => {
          if (!newCompletedState) {
            toast.success('הסימון בוטל');
          }
        },
      }
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {showReward && !isCompleted && (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          +{LESSON_XP} XP
        </span>
      )}
      <Button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        variant={isCompleted ? "secondary" : "default"}
        className={cn("button-glow", className)}
        disabled={!isAuthenticated || isLoading}
        aria-label={isCompleted ? "בטל סימון השיעור כהושלם" : "סמן שיעור כהושלם"}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
            מעדכן...
          </>
        ) : (
          <>
            <CheckCircle className={cn("w-4 h-4 ml-2", isCompleted && "text-success")} />
            {isCompleted ? "הושלם" : "סמן כהושלם"}
          </>
        )}
      </Button>
    </div>
  );
};

export default ProgressToggle;
