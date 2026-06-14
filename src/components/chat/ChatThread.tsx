import { useEffect, useRef, useState } from "react";
import { useThread, useSendMessage, useMarkRead, type DirectMessage } from "@/hooks/useMessages";
import { usePublicProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowRight, Send, Download, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

interface ChatThreadProps {
  otherId: string;
  onBack?: () => void;
}

export function ChatThread({ otherId, onBack }: ChatThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useThread(otherId);
  const { data: partner } = usePublicProfile(otherId);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark messages as read whenever the partner / incoming messages change.
  useEffect(() => {
    if (otherId) markRead.mutate(otherId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId, messages?.length]);

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const name = partner?.full_name ?? "משתמש";

  const handleSend = () => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate(
      { to: otherId, content },
      { onSuccess: () => setDraft("") },
    );
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1 px-2 lg:hidden"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarImage src={partner?.profile_picture_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-primary/15 text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          {partner?.headline && (
            <p className="truncate text-xs text-muted-foreground">{partner.headline}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-4">
          {isLoading ? (
            <ThreadSkeleton />
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">אין הודעות עדיין</p>
              <p className="mt-1 text-xs text-muted-foreground">
                שלחו את ההודעה הראשונה לפתיחת השיחה
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} message={m} mine={m.sender_id === user?.id} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="כתבו הודעה..."
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="button-glow shrink-0"
            disabled={!draft.trim() || sendMessage.isPending}
            aria-label="שליחה"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message, mine }: { message: DirectMessage; mine: boolean }) {
  const time = message.created_at
    ? format(new Date(message.created_at), "HH:mm", { locale: he })
    : "";

  return (
    <div className={cn("flex w-full", mine ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
          mine
            ? "xp-gradient rounded-bl-sm text-primary-foreground"
            : "rounded-br-sm bg-muted text-foreground",
        )}
      >
        {message.attachment_url && (
          <Attachment
            url={message.attachment_url}
            type={message.attachment_type}
            name={message.attachment_name}
            mine={mine}
          />
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <span
          className={cn(
            "mt-1 block text-[10px] leading-none",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {time}
        </span>
      </div>
    </div>
  );
}

function Attachment({
  url,
  type,
  name,
  mine,
}: {
  url: string;
  type: string | null;
  name: string | null;
  mine: boolean;
}) {
  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
        <img
          src={url}
          alt={name ?? "תמונה"}
          className="max-h-64 w-auto rounded-lg object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs underline-offset-2 hover:underline",
        mine ? "bg-primary-foreground/15" : "bg-background/60",
      )}
    >
      <Download className="h-4 w-4 shrink-0" />
      <span className="truncate">{name ?? "הורדת קובץ"}</span>
    </a>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-40 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-9 w-52 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-2xl" />
      </div>
    </div>
  );
}

export default ChatThread;
