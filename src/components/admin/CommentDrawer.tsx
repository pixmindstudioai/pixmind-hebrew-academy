import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Check, 
  EyeOff, 
  Flag,
  Trash2
} from 'lucide-react';
import { CommentWithDetails } from '@/hooks/useCommentsData';

interface CommentDrawerProps {
  comment: CommentWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (commentId: string) => void;
  onHide: (commentId: string) => void;
  onFlag: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
}

const CommentDrawer = ({ comment, isOpen, onClose, onApprove, onHide, onFlag, onDelete }: CommentDrawerProps) => {
  if (!comment) return null;

  const getStatusBadge = (status: CommentWithDetails['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'ממתין לאישור' },
      approved: { variant: 'default' as const, label: 'מאושר' },
      hidden: { variant: 'outline' as const, label: 'מוסתר' },
      flagged: { variant: 'destructive' as const, label: 'מסומן' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>פרטי תגובה</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">תוכן התגובה</h3>
              <p className="text-xs md:text-sm bg-muted p-3 rounded-lg">{comment.content}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <h4 className="text-sm font-medium mb-1">שם משתמש</h4>
                <p className="text-muted-foreground">{comment.user?.full_name || 'משתמש לא ידוע'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">אימייל</h4>
                <p className="text-muted-foreground break-all">{comment.user?.email || 'לא זמין'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">שיעור</h4>
                <p className="text-muted-foreground">{comment.lesson.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">מודול</h4>
                <p className="text-muted-foreground">{comment.lesson.chapter.module.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">תאריך יצירה</h4>
                <p className="text-muted-foreground">
                  {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">סטטוס</h4>
                {getStatusBadge(comment.status)}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">דירוגים</h4>
                <p className="text-muted-foreground">👍 {comment.upvotes}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">דיווחים</h4>
                <p className="text-muted-foreground">🚩 {comment.report_count}</p>
              </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm md:text-base">תגובות ({comment.replies.length})</h3>
                <div className="space-y-3">
                  {comment.replies.filter(r => r.user).map((reply: any) => (
                    <div key={reply.id} className="bg-muted/50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={reply.user?.profile_picture_url} />
                          <AvatarFallback>{reply.user?.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs md:text-sm font-medium">{reply.user?.full_name || 'משתמש לא ידוע'}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm pr-8">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              {comment.status !== 'approved' && (
                <Button
                  onClick={() => {
                    onApprove(comment.id);
                    onClose();
                  }}
                  size="sm"
                  className="flex-1"
                >
                  <Check className="w-4 h-4 ml-2" />
                  אשר
                </Button>
              )}
              {comment.status !== 'hidden' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onHide(comment.id);
                    onClose();
                  }}
                  className="flex-1"
                >
                  <EyeOff className="w-4 h-4 ml-2" />
                  הסתר
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFlag(comment.id);
                  onClose();
                }}
                className="flex-1"
              >
                <Flag className="w-4 h-4 ml-2" />
                סמן
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(comment.id);
                  onClose();
                }}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                מחק
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentDrawer;
