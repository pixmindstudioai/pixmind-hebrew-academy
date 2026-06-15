import { Lock, Package, ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BundleWithModules, AccessState } from "@/types/bundle";
import { cn } from "@/lib/utils";
import { isNativeIOSApp } from "@/lib/platform";

interface BundleCardProps {
  bundle: BundleWithModules;
  accessState: AccessState;
  onNavigate: () => void;
  onPurchase: () => void;
}

const accessLabels: Record<AccessState, string> = {
  free: 'חינמי',
  open: 'פתוח',
  locked: 'נעול',
};

const BundleCard = ({
  bundle,
  accessState,
  onNavigate,
  onPurchase,
}: BundleCardProps) => {
  const isLocked = accessState === 'locked';
  const isFree = accessState === 'free';

  const handleClick = () => {
    // App is view-only — a locked bundle just opens its (gated) content, never a purchase flow.
    if (isLocked && !isNativeIOSApp()) {
      onPurchase();
    } else {
      onNavigate();
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-2 transition-all duration-300",
        isLocked 
          ? "border-border/40 opacity-90 hover:opacity-100" 
          : "border-primary/30 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10"
      )}
    >
      {/* Bundle indicator ribbon */}
      <div className="absolute top-4 -left-8 z-10 rotate-[-45deg]">
        <div className="bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
          חבילה
        </div>
      </div>

      <CardHeader className="p-0">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/30 to-accent/20">
          {/* Thumbnail */}
          {bundle.thumbnail_url ? (
            <img
              src={bundle.thumbnail_url}
              alt={bundle.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                !isLocked && "group-hover:scale-105"
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 text-primary/40" />
            </div>
          )}

          {/* Locked Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center border border-border/50">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">חבילה נעולה</span>
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

      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {bundle.title}
          </h3>
          {bundle.description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {bundle.description}
            </p>
          )}
        </div>

        {/* Included courses list */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            קורסים כלולים ({bundle.modules.length})
          </h4>
          <div className="space-y-1.5">
            {bundle.modules.slice(0, 3).map((module) => (
              <div 
                key={module.id}
                className="flex items-center gap-2 text-sm text-foreground/80"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                <span className="line-clamp-1">{module.title}</span>
              </div>
            ))}
            {bundle.modules.length > 3 && (
              <div className="text-xs text-muted-foreground">
                + עוד {bundle.modules.length - 3} קורסים
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          className="w-full gap-2"
          variant={isLocked ? "outline" : "premium"}
          onClick={handleClick}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              {isNativeIOSApp() ? 'פרטים' : 'לרכישת החבילה'}
            </>
          ) : (
            <>
              לצפייה בחבילה
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BundleCard;
