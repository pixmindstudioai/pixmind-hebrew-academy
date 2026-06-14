import { useState } from "react";
import AuthenticationGuard from "@/components/admin/AuthenticationGuard";
import {
  ResponsiveTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ResponsiveTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, MessagesSquare, Pin, PinOff, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/hooks/useFeed";
import {
  useAdminFeedPosts,
  useAdminFeedComments,
  useTogglePinPost,
  useDeleteFeedPost,
  useDeleteFeedComment,
} from "@/hooks/useFeedModeration";

const TYPE_LABELS: Record<string, string> = {
  update: "עדכון",
  win: "הישג",
  question: "שאלה",
  showcase: "תצוגה",
};

const TYPE_STYLES: Record<string, string> = {
  update: "bg-primary/10 text-primary border-primary/20",
  win: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  question: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  showcase: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

function TypePill({ type }: { type: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", TYPE_STYLES[type] ?? "")}>
      {TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: he });
  } catch {
    return "";
  }
}

function initials(name?: string | null) {
  return name?.trim().charAt(0) || "מ";
}

/** Dialog listing a single post's comments with per-comment delete. */
function CommentsDialog({
  post,
  open,
  onOpenChange,
}: {
  post: FeedPost | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: comments, isLoading } = useAdminFeedComments(post?.id ?? null);
  const deleteComment = useDeleteFeedComment();

  const handleDelete = (commentId: string) => {
    if (!post) return;
    if (window.confirm("למחוק את התגובה לצמיתות?")) {
      deleteComment.mutate({ commentId, postId: post.id });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-right">
          <DialogTitle>תגובות לפוסט</DialogTitle>
          <DialogDescription>ניהול תגובות הקהילה לפוסט זה</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pl-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              אין תגובות לפוסט זה
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={c.author?.profile_picture_url ?? undefined} />
                    <AvatarFallback>{initials(c.author?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {c.author?.full_name || "משתמש"}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {c.content}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(c.id)}
                    title="מחיקת תגובה"
                    className="h-8 w-8 shrink-0 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

const FeedModerationPage = () => {
  const { data: posts, isLoading } = useAdminFeedPosts();
  const togglePin = useTogglePinPost();
  const deletePost = useDeleteFeedPost();

  const [commentsPost, setCommentsPost] = useState<FeedPost | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const openComments = (post: FeedPost) => {
    setCommentsPost(post);
    setCommentsOpen(true);
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("למחוק את הפוסט לצמיתות? פעולה זו אינה ניתנת לביטול.")) {
      deletePost.mutate(postId);
    }
  };

  const list = posts ?? [];
  const totalPosts = list.length;
  const pinnedCount = list.filter((p) => p.pinned).length;
  const totalComments = list.reduce((sum, p) => sum + (p.comment_count ?? 0), 0);

  return (
    <AuthenticationGuard>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ניהול פיד הקהילה</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            מודרציה של פוסטים ותגובות בפיד הקהילה
          </p>
        </div>

        {!isLoading && totalPosts > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <StatCard label="סך הפוסטים" value={totalPosts} />
            <StatCard label="פוסטים נעוצים" value={pinnedCount} />
            <StatCard label="סך התגובות" value={totalComments} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : totalPosts === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">הפיד ריק כרגע</p>
            <p className="text-sm">פוסטים חדשים של הקהילה יופיעו כאן</p>
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>מחבר</TableHead>
                <TableHead className="hidden sm:table-cell">סוג</TableHead>
                <TableHead>תוכן</TableHead>
                <TableHead className="hidden lg:table-cell text-center">מעורבות</TableHead>
                <TableHead className="hidden md:table-cell">נוצר</TableHead>
                <TableHead className="text-center">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                        <AvatarImage src={post.author?.profile_picture_url ?? undefined} />
                        <AvatarFallback>{initials(post.author?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {post.author?.full_name || "משתמש"}
                        </p>
                        {post.pinned && (
                          <Badge
                            variant="outline"
                            className="mt-1 gap-1 text-[10px] bg-primary/10 text-primary border-primary/20"
                          >
                            <Pin className="h-3 w-3" />
                            נעוץ
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <TypePill type={post.type} />
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[16rem] truncate text-sm text-muted-foreground">
                      {post.content || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {post.like_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.comment_count ?? 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {timeAgo(post.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePin.mutate({ postId: post.id, pinned: !post.pinned })}
                        title={post.pinned ? "ביטול נעיצה" : "נעיצת פוסט"}
                        className="h-8 w-8 p-0"
                      >
                        {post.pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openComments(post)}
                        title="תגובות"
                        className="h-8 w-8 p-0"
                      >
                        <MessagesSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePost(post.id)}
                        title="מחיקת פוסט"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        )}

        <CommentsDialog post={commentsPost} open={commentsOpen} onOpenChange={setCommentsOpen} />
      </div>
    </AuthenticationGuard>
  );
};

export default FeedModerationPage;
