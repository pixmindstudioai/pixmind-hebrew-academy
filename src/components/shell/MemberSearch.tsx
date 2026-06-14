import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMembersDirectory } from "@/hooks/useProfiles";

function initials(name?: string | null) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/** Top-bar member search — discover people to follow / message. */
export function MemberSearch({ className }: { className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data: results = [] } = useMembersDirectory(q, 8);
  const show = open && q.trim().length >= 2;

  return (
    <Popover open={show} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={className}>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="חיפוש חברים…"
              className="h-10 rounded-full border-border/60 bg-muted/40 pr-9 text-sm focus-visible:bg-background"
            />
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-72 p-1.5" onOpenAutoFocus={(e) => e.preventDefault()}>
        {results.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">לא נמצאו חברים</p>
        ) : (
          results.map((m) => (
            <Link
              key={m.id}
              to={`/profile/${m.id}`}
              onClick={() => { setOpen(false); setQ(""); }}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.profile_picture_url ?? undefined} />
                <AvatarFallback className="text-[11px]">{initials(m.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{m.full_name || "חבר/ה"}</div>
                <div className="truncate text-xs text-muted-foreground">רמה {m.level ?? 1} · {(m.xp_total ?? 0).toLocaleString()} XP</div>
              </div>
            </Link>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
