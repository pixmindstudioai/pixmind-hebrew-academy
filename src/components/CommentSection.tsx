import { useState } from "react";
import { ThumbsUp, MessageCircle, Flag, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  lessonId: string;
  comments: Comment[];
}

const CommentItem = ({ 
  comment, 
  isReply = false,
  onReply,
  onLike,
  onFlag 
}: { 
  comment: Comment;
  isReply?: boolean;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onFlag: (commentId: string) => void;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id);
      setReplyText("");
      setShowReplyForm(false);
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
                  {comment.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-card-foreground">
                  {comment.author}
                </div>
                <div className="text-xs text-muted-foreground">
                  {comment.timestamp}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFlag(comment.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Flag className="w-4 h-4" />
            </Button>
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
              onClick={() => onLike(comment.id)}
              className={cn(
                "text-xs",
                comment.isLiked ? "text-primary" : "text-muted-foreground"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
              <span>{comment.likes}</span>
            </Button>

            {!isReply && (
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
                placeholder="כתוב תגובה..."
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

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              onReply={onReply}
              onLike={onLike}
              onFlag={onFlag}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ lessonId, comments }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      // Handle comment submission
      console.log("New comment:", newComment);
      setNewComment("");
    }
  };

  const handleReply = (commentId: string) => {
    console.log("Reply to comment:", commentId);
  };

  const handleLike = (commentId: string) => {
    console.log("Like comment:", commentId);
  };

  const handleFlag = (commentId: string) => {
    console.log("Flag comment:", commentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">
          תגובות ({comments.length})
        </h3>
      </div>

      {/* New comment form */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                ME
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="הוסף תגובה..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="button-glow"
                >
                  פרסם תגובה
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onLike={handleLike}
            onFlag={handleFlag}
          />
        ))}
      </div>

      {comments.length === 0 && (
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