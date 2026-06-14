import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Send } from "lucide-react";
import { useFeedComments, useAddComment } from "@/hooks/useFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentThreadProps {
  postId: string;
}

const initial = (name?: string | null) => name?.trim()?.charAt(0) || "מ";

const relTime = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: he });
  } catch {
    return "";
  }
};

export default function CommentThread({ postId }: CommentThreadProps) {
  const { data: comments = [], isLoading } = useFeedComments(postId);
  const addComment = useAddComment();
  const [content, setContent] = useState("");

  const submit = () => {
    const text = content.trim();
    if (!text) return;
    addComment.mutate(
      { postId, content: text },
      { onSuccess: () => setContent("") },
    );
  };

  return (
    <div className="mt-3 border-t border-border/60 pt-3" dir="rtl">
      {/* Composer */}
      <div className="flex items-start gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="כתבו תגובה..."
          rows={1}
          className="min-h-[40px] flex-1 resize-none bg-background/50"
        />
        <Button
          size="icon"
          className="shrink-0"
          onClick={submit}
          disabled={!content.trim() || addComment.isPending}
          aria-label="שליחת תגובה"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <div className="mt-3 space-y-3">
        {isLoading ? (
          [0, 1].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          ))
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            עדיין אין תגובות — פתחו את השיחה!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Link to={`/profile/${c.author_id}`} className="shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={c.author?.profile_picture_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {initial(c.author?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 rounded-xl bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${c.author_id}`}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {c.author?.full_name || "משתמש"}
                  </Link>
                  <span className="text-[11px] text-muted-foreground">
                    {relTime(c.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
