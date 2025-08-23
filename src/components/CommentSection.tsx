import { useState } from "react";
import { ThumbsUp, MessageCircle, Flag, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComment, useLessonComments } from "@/hooks/useContentData";
import { toast } from "sonner";

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  upvotes: number;
  parent_comment_id: string | null;
  user_id: string;
  users: {
    id: string;
    full_name: string;
  };
}

interface CommentSectionProps {
  lessonId: string;
}

const CommentItem = ({ 
  comment, 
  isReply = false,
  onReply
}: { 
  comment: CommentData;
  isReply?: boolean;
  onReply: (commentId: string, content: string) => void;
}) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.upvotes || 0);

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  const handleLike = () => {
    // Toggle like (mock functionality for now)
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `לפני ${hours} שעות`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `לפני ${days} ימים`;
    }
  };

  return (
    <div className={cn("space-y-3", isReply && "mr-8 border-r border-border/30 pr-4")}>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {comment.users.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-card-foreground">
                  {comment.users.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimestamp(comment.created_at)}
                </div>
              </div>
            </div>
            
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info('דיווח נשלח למנהלי האתר')}
                className="text-muted-foreground hover:text-destructive"
              >
                <Flag className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-card-foreground leading-relaxed mb-4">
            {comment.content}
          </p>

          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!user}
              className={cn(
                "text-xs",
                isLiked ? "text-primary" : "text-muted-foreground",
                !user && "cursor-not-allowed opacity-50"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />
              <span>{likeCount}</span>
            </Button>

            {!isReply && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-muted-foreground"
              >
                <Reply className="w-4 h-4" />
                <span>השב</span>
              </Button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="כתוב תשובה..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  ביטול
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                >
                  הגב
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CommentSection = ({ lessonId }: CommentSectionProps) => {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  
  const { data: comments = [], isLoading: commentsLoading } = useLessonComments(lessonId);
  const createComment = useCreateComment();

  // Separate parent comments and replies
  const parentComments = comments.filter(c => !c.parent_comment_id);
  const replies = comments.filter(c => c.parent_comment_id);

  // Group comments with their replies
  const commentsWithReplies = parentComments.map(parent => ({
    ...parent,
    replies: replies.filter(reply => reply.parent_comment_id === parent.id)
  }));

  const handleSubmitComment = () => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    createComment.mutate({
      lessonId,
      content: newComment
    }, {
      onSuccess: () => {
        setNewComment("");
      }
    });
  };

  const handleReply = (parentCommentId: string, content: string) => {
    if (!isAuthenticated) return;
    
    createComment.mutate({
      lessonId,
      content,
      parentCommentId
    });
  };

  if (commentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="mr-2">טוען תגובות...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">
          תגובות ({parentComments.length})
        </h3>
      </div>

      {/* Authentication check */}
      {!isAuthenticated ? (
        <Alert>
          <AlertDescription>
            יש להתחבר כדי לפרסם תגובות ולהגיב על שיעורים.
          </AlertDescription>
        </Alert>
      ) : (
        /* New comment form */
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user?.email?.slice(0, 2).toUpperCase() || 'ME'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="הוסף תגובה על השיעור..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || createComment.isPending}
                    className="button-glow"
                  >
                    {createComment.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      'פרסם תגובה'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {commentsWithReplies.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <CommentItem
              comment={comment}
              onReply={handleReply}
            />
            {/* Replies */}
            {comment.replies && comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply={true}
                onReply={handleReply}
              />
            ))}
          </div>
        ))}
      </div>

      {parentComments.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            עדיין אין תגובות. היה הראשון להגיב!
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;