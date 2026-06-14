import { useState } from "react";
import { useFeed, type PostType } from "@/hooks/useFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";

type FilterValue = "all" | PostType;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "update", label: "עדכון" },
  { value: "win", label: "ניצחון" },
  { value: "question", label: "שאלה" },
  { value: "showcase", label: "תוצר" },
];

export default function Feed() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const { data: posts = [], isLoading } = useFeed({ type: filter });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6" dir="rtl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="gradient-text text-3xl font-heading">הקהילה</h1>
        <p className="mt-1 text-muted-foreground">
          שתפו עדכונים, ניצחונות, שאלות ותוצרים — וצברו השראה מהחברים
        </p>
      </header>

      {/* Composer */}
      <PostComposer />

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterValue)}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-2xl px-6 py-16 text-center">
            <p className="text-muted-foreground">
              עדיין אין פוסטים — תהיו הראשונים!
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
