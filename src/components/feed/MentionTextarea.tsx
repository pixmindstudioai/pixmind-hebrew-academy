import { useEffect, useMemo, useRef, useState } from "react";
import { User, BookOpen, Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useMentionables,
  filterMentionables,
  type Mentionable,
  type MentionableType,
} from "@/hooks/useMentionables";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  dir?: "rtl" | "ltr";
}

const TYPE_ICON: Record<MentionableType, typeof User> = {
  user: User,
  lesson: BookOpen,
  task: Target,
};

const initial = (name?: string | null) => name?.trim()?.charAt(0) || "מ";

/**
 * Finds an active "@query" being typed immediately before the caret.
 * Returns the query text and the index of the "@" char, or null.
 */
function getActiveMention(text: string, caret: number): { query: string; at: number } | null {
  // Walk backwards from caret to find an unbroken @token (no whitespace/newline).
  let i = caret - 1;
  while (i >= 0) {
    const ch = text[i];
    if (ch === "@") {
      // Must be at start or preceded by whitespace to count as a mention trigger.
      const prev = text[i - 1];
      if (i === 0 || /\s/.test(prev)) {
        return { query: text.slice(i + 1, caret), at: i };
      }
      return null;
    }
    if (/\s/.test(ch)) return null; // whitespace before @ -> not an active mention
    i--;
  }
  return null;
}

/**
 * Controlled <Textarea> with @-mention autocomplete. On select, inserts a
 * structured token `@[label](type:id)` so PostCard can render real links.
 */
export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  dir = "rtl",
}: MentionTextareaProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { items } = useMentionables();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [atIndex, setAtIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo<Mentionable[]>(
    () => (open ? filterMentionables(items, query) : []),
    [open, items, query],
  );

  // Keep highlight in range when the suggestion list changes.
  useEffect(() => {
    setHighlight((h) => (suggestions.length ? Math.min(h, suggestions.length - 1) : 0));
  }, [suggestions.length]);

  const recompute = (text: string, caret: number) => {
    const active = getActiveMention(text, caret);
    if (active) {
      setOpen(true);
      setQuery(active.query);
      setAtIndex(active.at);
      setHighlight(0);
    } else {
      setOpen(false);
      setQuery("");
      setAtIndex(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);
    recompute(text, e.target.selectionStart ?? text.length);
  };

  const select = (m: Mentionable) => {
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? value.length;
    if (atIndex === null) return;
    const before = value.slice(0, atIndex);
    const after = value.slice(caret);
    const token = `@[${m.label}](${m.type}:${m.id}) `;
    const next = before + token + after;
    onChange(next);
    setOpen(false);
    setQuery("");
    setAtIndex(null);
    // Restore caret right after the inserted token.
    const newCaret = before.length + token.length;
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newCaret, newCaret);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      select(suggestions[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleSelectEvent = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    recompute(ta.value, ta.selectionStart ?? ta.value.length);
  };

  return (
    <div className="relative">
      <Textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectEvent}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        rows={rows}
        dir={dir}
        className={cn("resize-none bg-background/50", className)}
      />

      {open && suggestions.length > 0 && (
        <div
          dir="rtl"
          className="absolute right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-xl"
        >
          {suggestions.map((m, i) => {
            const Icon = TYPE_ICON[m.type];
            const active = i === highlight;
            return (
              <button
                key={`${m.type}-${m.id}`}
                type="button"
                // onMouseDown (not onClick) so it fires before the textarea blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(m);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-sm transition-colors",
                  active ? "bg-primary/15 text-primary" : "hover:bg-muted/60",
                )}
              >
                {m.type === "user" ? (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={m.avatar || undefined} />
                    <AvatarFallback className="text-xs">{initial(m.label)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{m.label}</span>
                  {m.sublabel && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {m.sublabel}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
