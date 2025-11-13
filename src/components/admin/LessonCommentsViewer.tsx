import { format } from 'date-fns';
import { MessageSquare, Clock, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useComments } from '@/hooks/useCommentsData';

interface LessonCommentsViewerProps {
  lessonId: string;
}

const LessonCommentsViewer = ({ lessonId }: LessonCommentsViewerProps) => {
  const { data: allComments, isLoading } = useComments({ lessonId });

  if (isLoading) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        טוען תגובות...
      </div>
    );
  }

  if (!allComments || allComments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">אין תגובות לשיעור זה</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'ממתין' },
      approved: { variant: 'default' as const, label: 'מאושר' },
      hidden: { variant: 'outline' as const, label: 'מוסתר' },
      flagged: { variant: 'destructive' as const, label: 'מסומן' },
    };
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {allComments.map((comment) => (
          <div key={comment.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user?.profile_picture_url} />
                <AvatarFallback>{comment.user?.full_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.user?.full_name || 'משתמש לא ידוע'}</span>
                  {getStatusBadge(comment.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  <ThumbsUp className="w-3 h-3 mr-2" />
                  <span>{comment.upvotes}</span>
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>

                {comment.replies && comment.replies.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2 pr-4">
                      <p className="text-xs font-medium text-muted-foreground">תגובות ({comment.replies.length})</p>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/30 rounded p-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={reply.user?.profile_picture_url} />
                              <AvatarFallback className="text-xs">{reply.user?.full_name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{reply.user?.full_name || 'משתמש לא ידוע'}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.created_at), 'dd/MM HH:mm')}
                            </span>
                          </div>
                          <p className="text-xs pr-7">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default LessonCommentsViewer;
