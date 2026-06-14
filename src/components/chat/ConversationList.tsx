import { useConversations, type Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (otherId: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">אין שיחות עדיין</p>
        <p className="mt-1 text-xs text-muted-foreground">
          התחילו שיחה מהפרופיל של חבר קהילה
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => (
          <ConversationRow
            key={conv.otherId}
            conv={conv}
            selected={conv.otherId === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function ConversationRow({
  conv,
  selected,
  onSelect,
}: {
  conv: Conversation;
  selected: boolean;
  onSelect: (otherId: string) => void;
}) {
  const name = conv.other?.full_name ?? "משתמש";
  const preview = conv.lastMessage?.content?.trim()
    ? conv.lastMessage.content
    : conv.lastMessage?.attachment_url
      ? "קובץ מצורף"
      : "";
  const time = conv.lastMessage?.created_at
    ? formatDistanceToNow(new Date(conv.lastMessage.created_at), {
        addSuffix: true,
        locale: he,
      })
    : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(conv.otherId)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors",
        "hover:bg-muted/60",
        selected && "bg-primary/10 ring-1 ring-primary/30",
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conv.other?.profile_picture_url ?? undefined} alt={name} />
        <AvatarFallback className="bg-primary/15 text-primary">
          {initials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          {time && (
            <span className="shrink-0 text-[11px] text-muted-foreground">{time}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-xs text-muted-foreground",
              conv.unread > 0 && "font-medium text-foreground",
            )}
          >
            {preview}
          </span>
          {conv.unread > 0 && (
            <Badge className="shrink-0 bg-primary px-1.5 text-primary-foreground">
              {conv.unread}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationList;
