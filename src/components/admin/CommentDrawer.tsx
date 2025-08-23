
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  X, 
  ThumbsUp, 
  MessageSquare, 
  Flag, 
  Check,
  Eye,
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ModerationComment, ModerationAction } from '@/types/admin';

interface CommentDrawerProps {
  comment: ModerationComment | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (commentId: string) => void;
  onHide: (commentId: string) => void;
  onFlag: (commentId: string) => void;
  onRestore: (commentId: string) => void;
}

const CommentDrawer = ({
  comment,
  isOpen,
  onClose,
  onApprove,
  onHide,
  onFlag,
  onRestore
}: CommentDrawerProps) => {
  if (!comment) return null;

  const getStatusBadge = (status: ModerationComment['status']) => {
    const variants = {
      pending: { label: 'ממתין', variant: 'secondary' as const },
      approved: { label: 'מאושר', variant: 'default' as const },
      hidden: { label: 'מוסתר', variant: 'destructive' as const },
      flagged: { label: 'מדווח', variant: 'outline' as const }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActionLabel = (action: ModerationAction['action']) => {
    const labels = {
      approve: 'אושר',
      hide: 'הוסתר',
      flag: 'דווח',
      restore: 'שוחזר'
    };
    return labels[action];
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:w-[600px]" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>פרטי התגובה</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-8">
            {/* Comment Status */}
            <div className="flex items-center justify-between">
              {getStatusBadge(comment.status)}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span>{comment.id}</span>
              </div>
            </div>

            {/* Comment Content */}
            <div className="space-y-3">
              <h3 className="font-medium">תוכן התגובה</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>

            {/* Comment Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{comment.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: he })}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                <span>{comment.upvotes} לייקים</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                <span>{comment.reportCount} דיווחים</span>
              </div>
            </div>

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  תשובות ({comment.replies.length})
                </h3>
                <div className="space-y-3">
                  {comment.replies.map((reply, index) => (
                    <div key={reply.id} className="bg-muted/20 rounded-lg p-3 mr-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{reply.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: he })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderation History */}
            {comment.moderationHistory.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">היסטוריית מודרציה</h3>
                <div className="space-y-2">
                  {comment.moderationHistory.map((action, index) => (
                    <div key={action.id} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getActionLabel(action.action)}</span>
                        {action.reason && (
                          <span className="text-muted-foreground">- {action.reason}</span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(action.timestamp, { addSuffix: true, locale: he })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-medium">פעולות</h3>
              <div className="flex flex-wrap gap-2">
                {comment.status !== 'approved' && (
                  <Button 
                    onClick={() => onApprove(comment.id)}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    אישור
                  </Button>
                )}
                
                {comment.status !== 'hidden' && (
                  <Button 
                    variant="outline"
                    onClick={() => onHide(comment.id)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    הסתרה
                  </Button>
                )}
                
                {comment.status !== 'flagged' && (
                  <Button 
                    variant="outline"
                    onClick={() => onFlag(comment.id)}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    דיווח
                  </Button>
                )}
                
                {(comment.status === 'hidden' || comment.status === 'flagged') && (
                  <Button 
                    variant="outline"
                    onClick={() => onRestore(comment.id)}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    שחזור
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CommentDrawer;
