
import { Play, Clock, BookOpen, CheckCircle, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Module } from "@/hooks/useContentData";

interface ModuleCardProps {
  module: Module;
  lessonsCount?: number;
  completedLessons?: number;
  duration?: string;
  isStarted?: boolean;
  isAdminView?: boolean;
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
  onView?: (module: Module) => void;
  onClick?: (module: Module) => void;
}

const ModuleCard = ({
  module,
  lessonsCount = 0,
  completedLessons = 0,
  duration = "0 דקות",
  isStarted = false,
  isAdminView = false,
  onEdit,
  onDelete,
  onView,
  onClick,
}: ModuleCardProps) => {
  const progressPercentage = lessonsCount > 0 ? (completedLessons / lessonsCount) * 100 : 0;
  const isCompleted = completedLessons === lessonsCount && lessonsCount > 0;

  const getStatusBadge = () => {
    const variants = {
      draft: { label: 'טיוטה', variant: 'secondary' as const },
      active: { label: 'פעיל', variant: 'default' as const },
      archived: { label: 'בארכיון', variant: 'outline' as const }
    };
    
    const config = variants[module.status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card className="glass-card hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:scale-105 group">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-secondary aspect-video">
          {module.image_url ? (
            <img 
              src={module.image_url} 
              alt={module.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-secondary">
              <BookOpen className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Play overlay for user view */}
          {!isAdminView && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play className="w-8 h-8 text-primary-foreground mr-1" />
              </div>
            </div>
          )}

          {/* Status badge for admin view */}
          {isAdminView && (
            <div className="absolute top-4 left-4">
              {getStatusBadge()}
            </div>
          )}

          {/* Progress indicator for user view */}
          {!isAdminView && isStarted && (
            <div className="absolute top-4 left-4">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white">
                {progressPercentage.toFixed(0)}%
              </div>
            </div>
          )}

          {/* Completion badge */}
          {!isAdminView && isCompleted && (
            <div className="absolute top-4 right-4">
              <div className="bg-success/90 backdrop-blur-sm rounded-full p-2">
                <CheckCircle className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
          )}

          {/* Admin actions */}
          {isAdminView && (
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(module)}>
                      <Eye className="w-4 h-4 ml-2" />
                      צפייה
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(module)}>
                      <Edit className="w-4 h-4 ml-2" />
                      עריכה
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(module)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחיקה
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-primary transition-colors">
          {module.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
          {module.description}
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

        {/* Progress bar for user view */}
        {!isAdminView && isStarted && (
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

        {/* Admin info */}
        {isAdminView && (
          <div className="text-xs text-muted-foreground">
            <div>סדר: {module.order_index}</div>
            <div>נוצר: {new Date(module.created_at).toLocaleDateString('he-IL')}</div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button 
          className="w-full button-glow" 
          variant={isStarted || isAdminView ? "default" : "outline"}
          onClick={() => onClick?.(module)}
        >
          {isAdminView 
            ? "ניהול מודול"
            : isCompleted 
              ? "צפה שוב" 
              : isStarted 
                ? "המשך לימוד" 
                : "התחל ללמוד"
          }
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModuleCard;
