import { useState, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProgress, useLessonProgress } from "@/hooks/useContentData";
import { toast } from "sonner";

interface ProgressToggleProps {
  lessonId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

const ProgressToggle = ({ 
  lessonId, 
  className,
  variant = "default",
  size = "default"
}: ProgressToggleProps) => {
  const { user, isAuthenticated } = useAuth();
  const { data: userProgress } = useLessonProgress(lessonId, user?.id);
  const updateProgress = useUpdateProgress();
  const [isCompleted, setIsCompleted] = useState(false);

  // Set completion state from user progress
  useEffect(() => {
    if (userProgress) {
      setIsCompleted(userProgress.completed);
    }
  }, [userProgress]);

  const handleToggle = () => {
    if (!isAuthenticated || !lessonId) {
      toast.error('יש להתחבר כדי לסמן שיעורים כהושלמו');
      return;
    }
    
    const newCompletedState = !isCompleted;
    
    updateProgress.mutate({
      userId: user!.id,
      lessonId: lessonId,
      completed: newCompletedState
    }, {
      onSuccess: () => {
        setIsCompleted(newCompletedState);
        if (newCompletedState) {
          toast.success('✔️ השיעור סומן כהושלם');
        } else {
          toast.success('הסימון בוטל');
        }
      },
      onError: () => {
        toast.error('שגיאה בעדכון ההתקדמות. נסו שוב.');
      }
    });
  };

  return (
    <Button
      onClick={handleToggle}
      variant={isCompleted ? "secondary" : variant}
      size={size}
      className={className}
      disabled={!isAuthenticated || updateProgress.isPending}
    >
      {updateProgress.isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin ml-2" />
          מעדכן...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 ml-2" />
          {isCompleted ? "בטל סימון" : "סמן כהושלם"}
        </>
      )}
    </Button>
  );
};

export default ProgressToggle;