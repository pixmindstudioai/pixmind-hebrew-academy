import { Play, Lock, BookOpen, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Module } from "@/hooks/useContentData";
import type { AccessState } from "@/types/bundle";
import { cn } from "@/lib/utils";
import { isNativeIOSApp } from "@/lib/platform";

interface CourseCardProps {
  module: Module;
  accessState: AccessState;
  lessonsCount?: number;
  onNavigate: () => void;
  onPurchase: () => void;
}

const accessLabels: Record<AccessState, string> = {
  free: 'חינמי',
  open: 'פתוח',
  locked: 'נעול',
};

const CourseCard = ({
  module,
  accessState,
  lessonsCount = 0,
  onNavigate,
  onPurchase,
}: CourseCardProps) => {
  const isLocked = accessState === 'locked';
  const isFree = accessState === 'free';

  const handleClick = () => {
    // App is view-only — a locked course opens its (gated) content, never a purchase flow.
    if (isLocked && !isNativeIOSApp()) {
      onPurchase();
    } else {
      onNavigate();
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-border/40 transition-all duration-300",
        isLocked 
          ? "opacity-90 hover:opacity-100" 
          : "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden bg-secondary/30">
          {/* Thumbnail */}
          {(module.thumbnail_url || module.image_url) ? (
            <img
              src={module.thumbnail_url || module.image_url}
              alt={module.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                !isLocked && "group-hover:scale-105"
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/50">
              <BookOpen className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Locked Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center border border-border/50">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">תוכן נעול</span>
              </div>
            </div>
          )}

          {/* Play Overlay for unlocked */}
          {!isLocked && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Play className="w-7 h-7 text-primary-foreground mr-0.5" />
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={isFree ? 'success' : isLocked ? 'secondary' : 'default'}
              className={cn(
                "backdrop-blur-sm",
                isFree && "bg-success/90 text-success-foreground",
                isLocked && "bg-secondary/90 text-secondary-foreground",
                !isFree && !isLocked && "bg-primary/90 text-primary-foreground"
              )}
            >
              {isFree && <Sparkles className="w-3 h-3 ml-1" />}
              {isLocked && <Lock className="w-3 h-3 ml-1" />}
              {accessLabels[accessState]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-2 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {module.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Course Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{lessonsCount} שיעורים</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          className="w-full gap-2"
          variant={isLocked ? "outline" : "default"}
          onClick={handleClick}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              {isNativeIOSApp() ? 'פרטים' : 'לרכישה'}
            </>
          ) : (
            <>
              להתחלה
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
