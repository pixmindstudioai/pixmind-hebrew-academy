import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ResponsiveTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ResponsiveTable';
import { 
  Check, 
  EyeOff, 
  Eye, 
  Trash2,
  Edit2,
  MessageSquare
} from 'lucide-react';
import { CommentWithDetails } from '@/hooks/useCommentsData';

interface ModerationTableProps {
  comments: CommentWithDetails[];
  onApprove: (commentId: string) => void;
  onHide: (commentId: string) => void;
  onFlag: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onView: (comment: CommentWithDetails) => void;
}

const ModerationTable = ({ comments, onApprove, onHide, onFlag, onDelete, onEdit, onView }: ModerationTableProps) => {
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);

  const getStatusBadge = (status: CommentWithDetails['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'ממתין' },
      approved: { variant: 'default' as const, label: 'מאושר' },
      hidden: { variant: 'outline' as const, label: 'מוסתר' },
      flagged: { variant: 'destructive' as const, label: 'מסומן' },
    };
    const config = variants[status];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const handleEditSubmit = () => {
    if (editingComment) {
      onEdit(editingComment.id, editingComment.content);
      setEditingComment(null);
    }
  };

  return (
    <>
      <div className="space-y-3 md:space-y-4">
        <ResponsiveTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 md:w-16"></TableHead>
              <TableHead>תוכן</TableHead>
              <TableHead className="hidden md:table-cell">משתמש</TableHead>
              <TableHead className="hidden lg:table-cell">שיעור/מודול</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead className="hidden sm:table-cell">תאריך</TableHead>
              <TableHead className="text-center">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm md:text-base">
                  לא נמצאו תגובות
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarImage src={comment.user?.profile_picture_url} />
                      <AvatarFallback>{comment.user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="max-w-[150px] md:max-w-xs">
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm line-clamp-2">{comment.content}</p>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>{comment.replies.length} תשובות</span>
                        </div>
                      )}
                      <div className="md:hidden text-xs text-muted-foreground">
                        {comment.user?.full_name || 'משתמש לא ידוע'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs md:text-sm">
                      <div className="font-medium">{comment.user?.full_name || 'משתמש לא ידוע'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{comment.user?.email || 'לא זמין'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-xs space-y-0.5">
                      <div className="font-medium line-clamp-1">{comment.lesson.title}</div>
                      <div className="text-muted-foreground line-clamp-1">{comment.lesson.chapter.module.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs md:text-sm">
                    {format(new Date(comment.created_at), 'dd/MM/yy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 md:gap-1 justify-center flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(comment)}
                        title="צפייה"
                        className="h-9 w-9 md:h-8 md:w-8 p-0"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                      {comment.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onApprove(comment.id)}
                          title="אישור"
                          className="h-9 w-9 md:h-8 md:w-8 p-0"
                        >
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        </Button>
                      )}
                      {comment.status !== 'hidden' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onHide(comment.id)}
                          title="הסתרה"
                          className="h-9 w-9 md:h-8 md:w-8 p-0"
                        >
                          <EyeOff className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                        title="עריכה"
                        className="h-9 w-9 md:h-8 md:w-8 p-0"
                      >
                        <Edit2 className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(comment.id)}
                        title="מחיקה"
                        className="h-9 w-9 md:h-8 md:w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </ResponsiveTable>
      </div>

      <Dialog open={!!editingComment} onOpenChange={() => setEditingComment(null)}>
        <DialogContent dir="rtl" className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת תגובה</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingComment?.content || ''}
            onChange={(e) => setEditingComment(prev => prev ? { ...prev, content: e.target.value } : null)}
            rows={6}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingComment(null)}>ביטול</Button>
            <Button onClick={handleEditSubmit}>שמירה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModerationTable;
