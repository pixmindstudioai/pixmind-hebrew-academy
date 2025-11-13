import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLessonCommentCounts } from '@/hooks/useCommentsData';
import LessonCommentsViewer from './LessonCommentsViewer';

interface LessonCommentsButtonProps {
  lessonId: string;
  lessonTitle?: string;
}

const LessonCommentsButton = ({ lessonId, lessonTitle }: LessonCommentsButtonProps) => {
  const [open, setOpen] = useState(false);
  const { data: counts } = useLessonCommentCounts([lessonId]);
  
  const commentCount = counts?.[lessonId];
  const totalComments = commentCount?.total || 0;
  const pendingComments = commentCount?.pending || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          <span>תגובות</span>
          {totalComments > 0 && (
            <Badge variant={pendingComments > 0 ? "secondary" : "default"} className="text-xs">
              {totalComments}
              {pendingComments > 0 && ` (${pendingComments} ממתינות)`}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-right">
            תגובות - {lessonTitle || 'שיעור'}
          </DialogTitle>
        </DialogHeader>
        <LessonCommentsViewer lessonId={lessonId} />
      </DialogContent>
    </Dialog>
  );
};

export default LessonCommentsButton;
