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
import { Lock, ArrowLeft } from 'lucide-react';

interface MandatoryTaskBlockerProps {
  isBlocked: boolean;
  taskLessonId?: string;
  taskLessonTitle?: string;
}

const MandatoryTaskBlocker: React.FC<MandatoryTaskBlockerProps> = ({
  isBlocked,
  taskLessonId,
  taskLessonTitle,
}) => {
  const navigate = useNavigate();

  // Block ESC key at document level when modal is shown
  useEffect(() => {
    if (!isBlocked || !taskLessonId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isBlocked, taskLessonId]);

  // Don't render if not blocked or no lesson to navigate to
  if (!isBlocked || !taskLessonId) return null;

  const handleGoToTask = () => {
    navigate(`/lesson/${taskLessonId}`);
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-md text-center">
        <AlertDialogHeader className="items-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl">
            יש להשלים משימה לפני המשך
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground">
            שיעור זה נעול עד שתשלים את המשימה בשיעור הקודם.
            {taskLessonTitle && (
              <span className="block mt-2 font-medium text-foreground">
                "{taskLessonTitle}"
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center sm:justify-center">
          <Button
            onClick={handleGoToTask}
            className="w-full sm:w-auto"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            עבור למשימה
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MandatoryTaskBlocker;
