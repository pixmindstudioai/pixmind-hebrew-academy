import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Pin } from "lucide-react";
import { useToggleLike, useDeletePost, type FeedPost, type PostType } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import CommentThread from "./CommentThread";
import AcademyVideoPlayer from "@/components/AcademyVideoPlayer";

/** True when a URL points at a playable video (by extension). */
export const isVideoUrl = (url: string) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);

/** Structured mention token, e.g. `@[name](user:uuid)`. */
const MENTION_RE = /@\[([^\]]+)\]\((user|lesson|task):([^)]+)\)/g;
const mentionHref = (type: string, id: string) =>
  type === "user" ? `/profile/${id}` : type === "lesson" ? `/lesson/${id}` : `/tasks/${id}`;

interface PostCardProps {
  post: FeedPost;
}

/** Shared sizing/shape for the post-type pills (color comes from pill-* classes). */
export const PILL_BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

/** Pill class + Hebrew label per post type. */
export const POST_TYPE_META: Record<PostType, { label: string; pill: string }> = {
  update: { label: "עדכון", pill: "pill-update" },
  win: { label: "ניצחון", pill: "pill-win" },
  question: { label: "שאלה", pill: "pill-question" },
  showcase: { label: "תוצר", pill: "pill-showcase" },
};

const initial = (name?: string | null) => name?.trim()?.charAt(0) || "מ";

const relTime = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: he });
  } catch {
    return "";
  }
};

/** Highlights cosmetic @word / #tag inside a plain text segment. */
function highlightPlain(text: string, keyPrefix: string) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, i) => {
    if (/^[@#][^\s]+/.test(part)) {
      return (
        <span key={`${keyPrefix}-${i}`} className="font-medium text-primary">
          {part}
        </span>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

/**
 * Renders content with real mention links (`@[label](type:id)` -> <Link>),
 * plus cosmetic @word/#tag highlighting. Line breaks are preserved.
 */
function RichContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  MENTION_RE.lastIndex = 0;
  while ((match = MENTION_RE.exec(text)) !== null) {
    const [full, label, type, id] = match;
    if (match.index > last) {
      nodes.push(
        <Fragment key={`t-${key}`}>
          {highlightPlain(text.slice(last, match.index), `p-${key}`)}
        </Fragment>,
      );
    }
    nodes.push(
      <Link key={`m-${key}`} to={mentionHref(type, id)} className="font-medium text-primary hover:underline">
        @{label}
      </Link>,
    );
    last = match.index + full.length;
    key++;
  }
  if (last < text.length) {
    nodes.push(
      <Fragment key={`t-${key}`}>{highlightPlain(text.slice(last), `p-${key}`)}</Fragment>,
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/90">
      {nodes}
    </p>
  );
}

/** FB/LinkedIn-style media block: dedicated video players + image grid w/ lightbox. */
function MediaGrid({ media }: { media: string[] }) {
  const list = media.filter(Boolean);
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!list.length) return null;

  const videos = list.filter(isVideoUrl);
  const images = list.filter((u) => !isVideoUrl(u));

  const imgCols =
    images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="mt-3 space-y-2">
      {videos.map((src, i) => (
        <AcademyVideoPlayer key={`v-${i}`} src={src} className="shadow-sm shadow-primary/5" />
      ))}

      {images.length > 0 && (
        <div className={cn("grid gap-2", imgCols)}>
          {images.map((src, i) => (
            <button
              key={`i-${i}`}
              type="button"
              onClick={() => setLightbox(src)}
              className={cn(
                "block overflow-hidden rounded-xl border border-border/60",
                images.length === 3 && i === 0 && "sm:row-span-2",
              )}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full max-h-80 w-full object-cover transition-transform hover:scale-[1.02]"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-hidden border-border/60 bg-background/95 p-2">
          {lightbox && (
            <img src={lightbox} alt="" className="max-h-[80vh] w-full rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const [showComments, setShowComments] = useState(false);

  const isMine = !!user?.id && user.id === post.author_id;
  const meta = POST_TYPE_META[(post.type as PostType)] ?? POST_TYPE_META.update;

  // Optimistic local mirror for like state/count.
  const [liked, setLiked] = useState(!!post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);

  const onLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    toggleLike.mutate(post.id, {
      onError: () => {
        setLiked(!next);
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      },
    });
  };

  return (
    <article className="glass-card rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <header className="flex items-start gap-3">
        <Link to={`/profile/${post.author_id}`} className="shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.profile_picture_url || undefined} />
            <AvatarFallback>{initial(post.author?.full_name)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/profile/${post.author_id}`}
              className="truncate font-medium hover:text-primary"
            >
              {post.author?.full_name || "משתמש"}
            </Link>
            <span className={cn(PILL_BASE, meta.pill, "shrink-0")}>{meta.label}</span>
            {post.pinned && (
              <Pin className="h-3.5 w-3.5 text-primary" aria-label="מוצמד" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">{relTime(post.created_at)}</span>
        </div>

        {isMine && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deletePost.mutate(post.id)}
                disabled={deletePost.isPending}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                מחיקה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* Body */}
      {post.content?.trim() && (
        <div className="mt-3">
          <RichContent text={post.content} />
        </div>
      )}
      <MediaGrid media={post.images ?? []} />

      {/* Footer */}
      <footer className="mt-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          disabled={toggleLike.isPending}
          className={cn("gap-1.5", liked && "text-primary")}
          aria-pressed={liked}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-primary")} />
          <span className="text-sm tabular-nums">{likeCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
          className={cn("gap-1.5", showComments && "text-primary")}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm tabular-nums">{post.comment_count ?? 0}</span>
        </Button>
      </footer>

      {showComments && <CommentThread postId={post.id} />}
    </article>
  );
}
