import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLessons, useUserProgress } from "@/hooks/useContentData";

interface ChapterProgressTrackerProps {
  chapterId: string;
  chapterTitle: string;
  className?: string;
}

const ChapterProgressTracker = ({ chapterId, chapterTitle, className }: ChapterProgressTrackerProps) => {
  const { user, isAuthenticated } = useAuth();
  const { data: lessons = [] } = useLessons(chapterId, 'active');
  const { data: userProgress = [] } = useUserProgress(user?.id);
  
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Calculate progress
  useEffect(() => {
    if (!lessons.length || !isAuthenticated) {
      setProgressPercentage(0);
      setCompletedCount(0);
      return;
    }

    const lessonIds = lessons.map(lesson => lesson.id);
    const completedLessons = userProgress.filter(
      progress => progress.completed && lessonIds.includes(progress.lesson_id)
    );
    
    const completed = completedLessons.length;
    const percentage = lessons.length > 0 ? (completed / lessons.length) * 100 : 0;
    
    setCompletedCount(completed);
    setProgressPercentage(percentage);
  }, [lessons, userProgress, isAuthenticated]);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercentage);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  if (!isAuthenticated) {
    return (
      <Card className={cn("glass-card border border-border/20", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-center space-x-2 space-x-reverse">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              יש להתחבר כדי לעקוב אחר ההתקדמות בפרק
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = () => {
    if (progressPercentage === 100) return "from-success/80 to-success";
    if (progressPercentage >= 50) return "from-primary/80 to-primary";
    return "from-muted-foreground/60 to-muted-foreground/80";
  };

  const getProgressIcon = () => {
    if (progressPercentage === 100) return <CheckCircle className="w-5 h-5 text-success" />;
    return <BookOpen className="w-5 h-5 text-primary" />;
  };

  return (
    <Card className={cn("glass-card border border-border/20 overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getProgressIcon()}
            ההתקדמות שלי בפרק
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {progressPercentage === 100 ? (
              <span className="text-success font-medium">הושלם!</span>
            ) : (
              <span>{Math.round(progressPercentage)}%</span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {chapterTitle}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="relative">
            <Progress 
              value={animatedProgress} 
              className="h-3 bg-muted/30"
            />
            <div 
              className={cn(
                "absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                getProgressColor()
              )}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>

          {/* Progress Text */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="font-medium">
                {completedCount} מתוך {lessons.length} שיעורים הושלמו
              </span>
            </div>
            
            {progressPercentage > 0 && progressPercentage < 100 && (
              <span className="text-muted-foreground">
                נותרו {lessons.length - completedCount} שיעורים
              </span>
            )}
          </div>

          {/* Completion Celebration */}
          {progressPercentage === 100 && (
            <div className="animate-fade-in bg-success/10 border border-success/20 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-success font-medium">
                  כל הכבוד! סיימת את הפרק בהצלחה!
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChapterProgressTracker;