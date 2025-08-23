import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLessonRatings, useCreateOrUpdateRating } from "@/hooks/useContentData";
import { toast } from "sonner";

interface LessonRatingProps {
  lessonId: string;
  className?: string;
}

const LessonRating = ({ lessonId, className }: LessonRatingProps) => {
  const { user, isAuthenticated } = useAuth();
  const { data: ratingsData, isLoading } = useLessonRatings(lessonId);
  const createOrUpdateRating = useCreateOrUpdateRating();
  
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);

  // Calculate statistics from ratings data
  useEffect(() => {
    if (ratingsData) {
      const total = ratingsData.length;
      const average = total > 0 
        ? ratingsData.reduce((sum, rating) => sum + rating.rating, 0) / total 
        : 0;
      
      setAverageRating(average);
      setTotalRatings(total);
      
      // Find user's existing rating
      if (user) {
        const existingRating = ratingsData.find(rating => rating.user_id === user.id);
        setUserRating(existingRating?.rating || 0);
      }
    }
  }, [ratingsData, user]);

  const handleRatingClick = (rating: number) => {
    if (!isAuthenticated) {
      toast.error('יש להתחבר כדי לדרג שיעורים');
      return;
    }

    createOrUpdateRating.mutate({
      lessonId,
      rating
    }, {
      onSuccess: () => {
        setUserRating(rating);
        toast.success('הדירוג שלך נשמר!');
      },
      onError: (error) => {
        toast.error('שגיאה בשמירת הדירוג. נסה שוב.');
        console.error('Rating error:', error);
      }
    });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive = interactive 
        ? (hoveredStar >= starNumber || (!hoveredStar && userRating >= starNumber))
        : (rating >= starNumber);
      const isPartialFilled = !interactive && rating > index && rating < starNumber;
      
      return (
        <button
          key={starNumber}
          onClick={() => interactive && handleRatingClick(starNumber)}
          onMouseEnter={() => interactive && setHoveredStar(starNumber)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
          disabled={!interactive || createOrUpdateRating.isPending}
          className={cn(
            "transition-all duration-200",
            interactive && "hover:scale-110 cursor-pointer",
            !interactive && "cursor-default",
            createOrUpdateRating.isPending && "cursor-not-allowed opacity-50"
          )}
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors duration-200",
              isActive 
                ? "text-amber-400 fill-amber-400" 
                : "text-muted-foreground/40",
              isPartialFilled && "text-amber-400 fill-amber-200"
            )}
          />
        </button>
      );
    });
  };

  if (isLoading) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">טוען דירוגים...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("glass-card border border-border/20", className)}>
      <CardContent className="p-4 space-y-4">
        {/* User Rating Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">דרג את השיעור</h4>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-1 space-x-reverse">
              {renderStars(userRating, true)}
              {createOrUpdateRating.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription className="text-sm">
                יש להתחבר כדי לדרג שיעורים
              </AlertDescription>
            </Alert>
          )}
          
          {userRating > 0 && (
            <p className="text-xs text-muted-foreground">
              נתת לשיעור זה {userRating} כוכבים
            </p>
          )}
        </div>

        {/* Average Rating Display */}
        {totalRatings > 0 && (
          <div className="border-t border-border/20 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm font-medium">דירוג ממוצע:</span>
                <div className="flex items-center space-x-1 space-x-reverse">
                  {renderStars(averageRating, false)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} כוכבים
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              מבוסס על {totalRatings} דירוגים
            </p>
          </div>
        )}

        {/* No Ratings Yet */}
        {totalRatings === 0 && isAuthenticated && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              היה הראשון לדרג את השיעור הזה!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonRating;