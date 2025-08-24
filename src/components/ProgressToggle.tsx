import { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProgressToggleProps {
  lessonId: string;
  initialCompleted?: boolean;
  onToggle?: (completed: boolean) => void;
  className?: string;
}

const ProgressToggle = ({ 
  lessonId, 
  initialCompleted = false, 
  onToggle, 
  className = "" 
}: ProgressToggleProps) => {
  const { user, isAuthenticated } = useAuth();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsCompleted(initialCompleted);
  }, [initialCompleted]);

  const handleToggle = async () => {
    if (!isAuthenticated || !user || !lessonId) {
      toast.error('יש להתחבר כדי לסמן שיעורים כהושלמו');
      return;
    }

    setIsLoading(true);
    const newCompletedState = !isCompleted;

    try {
      // Use upsert to handle both insert and update cases - Issue F fix
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      // Update local state - optimistic UI
      setIsCompleted(newCompletedState);
      
      // Call callback if provided
      onToggle?.(newCompletedState);

      // Show success message
      if (newCompletedState) {
        toast.success('✔️ השיעור סומן כהושלם');
      } else {
        toast.success('הסימון בוטל');
      }

    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('שגיאה בעדכון ההתקדמות. נסו שוב.');
      // Revert optimistic update on error
      setIsCompleted(!newCompletedState);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <Button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      variant={isCompleted ? "secondary" : "default"}
      className={`button-glow ${className}`}
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
          <CheckCircle className={`w-4 h-4 ml-2 ${isCompleted ? 'text-success' : ''}`} />
          {isCompleted ? "בטל סימון" : "סמן כהושלם"}
        </>
      )}
    </Button>
  );
};

export default ProgressToggle;