import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatThread } from "@/components/chat/ChatThread";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toParam = searchParams.get("to");
  const [selectedId, setSelectedId] = useState<string | null>(toParam);

  // Open a thread directly when arriving via /messages?to=<userId>.
  useEffect(() => {
    if (toParam && toParam !== selectedId) setSelectedId(toParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toParam]);

  const handleSelect = (otherId: string) => {
    setSelectedId(otherId);
    // Clean the ?to= param once a partner is chosen.
    if (toParam) {
      searchParams.delete("to");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleBack = () => {
    setSelectedId(null);
    if (toParam) {
      searchParams.delete("to");
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6" dir="rtl">
      <div className="mb-4">
        <h1 className="font-heading text-2xl">הודעות</h1>
        <p className="text-sm text-muted-foreground">שיחות פרטיות עם חברי הקהילה</p>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="grid h-[calc(100svh-9rem-env(safe-area-inset-top))] min-h-[360px] sm:min-h-[480px] lg:h-[calc(100vh-13rem)] lg:grid-cols-[320px_1fr]">
          {/* Conversation list — full width on mobile only when no partner is open */}
          <div
            className={`min-h-0 border-l lg:block ${selectedId ? "hidden lg:block" : "block"}`}
          >
            <ConversationList selectedId={selectedId} onSelect={handleSelect} />
          </div>

          {/* Thread pane */}
          <div className={`min-h-0 ${selectedId ? "block" : "hidden lg:block"}`}>
            {selectedId ? (
              <ChatThread otherId={selectedId} onBack={handleBack} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center sm:px-6">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-medium">בחרו שיחה</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  בחרו שיחה מהרשימה כדי להתחיל להתכתב
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
