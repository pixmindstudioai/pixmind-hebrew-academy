import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Lock, ClipboardList } from 'lucide-react';

interface MandatoryTaskBlockerProps {
  isBlocked: boolean;
  taskLessonId?: string;
  taskLessonTitle?: string;
  isCurrentLessonTask?: boolean;
}

const MandatoryTaskBlocker: React.FC<MandatoryTaskBlockerProps> = ({
  isBlocked,
  taskLessonId,
  taskLessonTitle,
  isCurrentLessonTask = false,
}) => {
  const navigate = useNavigate();

  // Block ESC key at document level when modal is shown
  useEffect(() => {
    if (!isBlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isBlocked]);

  // Don't render if not blocked
  if (!isBlocked) return null;

  const handleGoToTask = () => {
    // Navigate to the tasks page
    navigate('/tasks');
  };

  const handleGoToTaskLesson = () => {
    if (taskLessonId) {
      navigate(`/lesson/${taskLessonId}`);
    }
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-md text-center">
        <AlertDialogHeader className="items-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl text-center">
            {isCurrentLessonTask 
              ? 'יש להשלים משימה בשיעור זה'
              : 'יש להשלים משימה לפני המשך'
            }
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground text-center">
            {isCurrentLessonTask ? (
              <>
                כדי להמשיך בשיעור זה, יש להשלים את המשימה המצורפת.
                {taskLessonTitle && (
                  <span className="block mt-2 font-medium text-foreground">
                    "{taskLessonTitle}"
                  </span>
                )}
              </>
            ) : (
              <>
                שיעור זה נעול עד שתשלים את המשימה בשיעור הקודם.
                {taskLessonTitle && (
                  <span className="block mt-2 font-medium text-foreground">
                    "{taskLessonTitle}"
                  </span>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center sm:justify-center mt-4">
          <Button
            onClick={isCurrentLessonTask ? handleGoToTask : handleGoToTaskLesson}
            className="w-full sm:w-auto gap-2"
            size="lg"
          >
            <ClipboardList className="w-5 h-5" />
            מעבר למשימה
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MandatoryTaskBlocker;
