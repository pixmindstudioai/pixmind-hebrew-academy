import { useRef, useState } from "react";
import { Send, ImagePlus, Loader2, X, Play } from "lucide-react";
import { useCreatePost, type PostType } from "@/hooks/useFeed";
import { useMyProfile } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { POST_TYPE_META, PILL_BASE, isVideoUrl } from "./PostCard";
import MentionTextarea from "./MentionTextarea";

const TYPES: PostType[] = ["update", "win", "question", "showcase"];
const MEDIA_BUCKET = "feed_media";
const MAX_BYTES = 100 * 1024 * 1024; // 100MB

const initial = (name?: string | null) => name?.trim()?.charAt(0) || "מ";

/** "react #tag, design" -> ["react", "tag", "design"] (strips #, dedupes). */
const parseTags = (raw: string): string[] =>
  Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean),
    ),
  );

export default function PostComposer() {
  const { data: profile } = useMyProfile();
  const { user } = useAuth();
  const createPost = useCreatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>("update");
  const [content, setContent] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setContent("");
    setTagsRaw("");
    setMedia([]);
    setType("update");
  };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;

    const uid = user?.id || profile?.id;
    if (!uid) {
      toast.error("יש להתחבר כדי להעלות מדיה");
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (!/^(image|video)\//.test(file.type)) {
          toast.error(`הקובץ ${file.name} אינו תמונה או וידאו`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`הקובץ ${file.name} גדול מדי (עד 100MB)`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const rand = Math.round(Math.random() * 1e9);
        const path = `${uid}/${Date.now()}-${rand}.${ext}`;
        const { error } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(`העלאת ${file.name} נכשלה`);
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        uploaded.push(publicUrl);
      }
      if (uploaded.length) setMedia((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error("העלאת המדיה נכשלה, נסו שוב");
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (url: string) =>
    setMedia((prev) => prev.filter((m) => m !== url));

  const submit = () => {
    const text = content.trim();
    if (!text && media.length === 0) return;
    createPost.mutate(
      {
        type,
        content: text,
        tags: parseTags(tagsRaw),
        images: media,
      },
      { onSuccess: reset },
    );
  };

  const canSubmit =
    (!!content.trim() || media.length > 0) && !createPost.isPending && !uploading;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5" dir="rtl">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.profile_picture_url || undefined} />
          <AvatarFallback>{initial(profile?.full_name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const meta = POST_TYPE_META[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    PILL_BASE,
                    meta.pill,
                    "transition-all",
                    active
                      ? "ring-2 ring-primary/60 ring-offset-1 ring-offset-background"
                      : "opacity-60 hover:opacity-100",
                  )}
                  aria-pressed={active}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="מה חדש? תייגו עם @ אנשים, שיעורים ואתגרים"
            rows={3}
          />

          <Input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="תגיות (מופרדות ברווח או פסיק)"
            className="bg-background/50"
          />

          {/* Staged media previews */}
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.map((url) => (
                <div
                  key={url}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-black"
                >
                  {isVideoUrl(url) ? (
                    <>
                      <video src={url} className="h-full w-full object-cover" muted />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white/90 drop-shadow" />
                      </span>
                    </>
                  ) : (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(url)}
                    aria-label="הסרה"
                    className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || createPost.isPending}
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploading ? "מעלה..." : "תמונה / וידאו"}
            </Button>

            <Button onClick={submit} disabled={!canSubmit} className="button-glow gap-2">
              <Send className="h-4 w-4" />
              פרסום
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
