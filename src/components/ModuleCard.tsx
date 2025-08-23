import { Play, Clock, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessonsCount: number;
  completedLessons: number;
  thumbnail?: string;
  isStarted?: boolean;
}

const ModuleCard = ({
  title,
  description,
  duration,
  lessonsCount,
  completedLessons,
  thumbnail,
  isStarted = false,
}: ModuleCardProps) => {
  const progressPercentage = (completedLessons / lessonsCount) * 100;
  const isCompleted = completedLessons === lessonsCount;

  return (
    <Card className="glass-card hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:scale-105 group">
      <CardHeader className="p-0">
        {/* Thumbnail */}
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-secondary aspect-video">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-secondary">
              <BookOpen className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-primary-foreground mr-1" />
            </div>
          </div>

          {/* Progress indicator */}
          {isStarted && (
            <div className="absolute top-4 left-4">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white">
                {progressPercentage.toFixed(0)}%
              </div>
            </div>
          )}

          {/* Completion badge */}
          {isCompleted && (
            <div className="absolute top-4 right-4">
              <div className="bg-success/90 backdrop-blur-sm rounded-full p-2">
                <CheckCircle className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {description}
        </p>

        {/* Course stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <BookOpen className="w-4 h-4" />
            <span>{lessonsCount} שיעורים</span>
          </div>
        </div>

        {/* Progress bar */}
        {isStarted && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">התקדמות</span>
              <span className="text-xs text-muted-foreground">
                {completedLessons}/{lessonsCount}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-muted"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button 
          className="w-full button-glow" 
          variant={isStarted ? "default" : "outline"}
        >
          {isCompleted ? "צפה שוב" : isStarted ? "המשך לימוד" : "התחל ללמוד"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModuleCard;