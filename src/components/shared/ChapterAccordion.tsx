
import { ChevronDown, Play, CheckCircle, Edit, Trash2, Plus, Users, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Chapter, Lesson } from "@/hooks/useContentData";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface Cohort {
  id: string;
  name: string;
}

interface ChapterAccordionProps {
  chapter: Chapter & { cohort?: Cohort | null };
  lessons: (Lesson & { cohort?: Cohort | null })[];
  completedLessons?: string[];
  isAdminView?: boolean;
  /** When true the chapter is gated behind an XP threshold the member hasn't reached. */
  lockedByXp?: boolean;
  /** The effective XP threshold required to open the chapter (for the lock badge copy). */
  requiredXp?: number;
  onLessonClick?: (lesson: Lesson) => void;
  onEditChapter?: (chapter: Chapter) => void;
  onDeleteChapter?: (chapter: Chapter) => void;
  onAddLesson?: (chapterId: string) => void;
  onEditLesson?: (lesson: Lesson) => void;
  onDeleteLesson?: (lesson: Lesson) => void;
}

const ChapterAccordion = ({
  chapter,
  lessons,
  completedLessons = [],
  isAdminView = false,
  lockedByXp = false,
  requiredXp = 0,
  onLessonClick,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: ChapterAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // XP gating only applies to the member-facing view (never in the admin editor).
  const isXpLocked = !isAdminView && lockedByXp;

  const completedCount = lessons.filter(lesson =>
    completedLessons.includes(lesson.id)
  ).length;
  const progressPercentage = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const handleLockedLessonAttempt = () => {
    toast.error("צברו עוד XP כדי לפתוח את הפרק");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'טיוטה', variant: 'secondary' as const },
      active: { label: 'פעיל', variant: 'default' as const },
      archived: { label: 'בארכיון', variant: 'outline' as const }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const getVisibilityBadge = (visibilityMode?: string, cohort?: Cohort | null, cohortId?: string | null) => {
    if (!visibilityMode || visibilityMode === 'all') {
      return (
        <Badge variant="outline" className="text-xs gap-1 bg-green-500/10 text-green-600 border-green-500/30">
          <Users className="w-3 h-3" />
          לכל התלמידים במודול
        </Badge>
      );
    }
    
    if (visibilityMode === 'cohort') {
      if (cohort?.name) {
        return (
          <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
            <Eye className="w-3 h-3" />
            רק למחזור: {cohort.name}
          </Badge>
        );
      }
      // cohort_id is set but cohort wasn't found (might have been deleted)
      if (cohortId) {
        console.warn(`Cohort with ID ${cohortId} not found`);
        return (
          <Badge variant="outline" className="text-xs gap-1 bg-orange-500/10 text-orange-600 border-orange-500/30">
            <Eye className="w-3 h-3" />
            רק למחזור (לא נמצא)
          </Badge>
        );
      }
      // cohort_id is null - misconfigured
      return (
        <Badge variant="outline" className="text-xs gap-1 bg-orange-500/10 text-orange-600 border-orange-500/30">
          <Eye className="w-3 h-3" />
          רק למחזור (לא הוגדר)
        </Badge>
      );
    }
    
    if (visibilityMode === 'inherit') {
      return (
        <Badge variant="outline" className="text-xs gap-1 bg-muted text-muted-foreground">
          לפי הגדרת הפרק
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <Collapsible
      open={isXpLocked ? false : isOpen}
      onOpenChange={(next) => {
        if (isXpLocked) {
          handleLockedLessonAttempt();
          return;
        }
        setIsOpen(next);
      }}
    >
      <div className={cn("border rounded-lg glass-card overflow-hidden", isXpLocked && "border-primary/30")}>
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between p-4 transition-colors",
              isXpLocked ? "cursor-not-allowed hover:bg-transparent" : "hover:bg-muted/50 cursor-pointer"
            )}
          >
            <div className="flex items-center space-x-3 space-x-reverse flex-1">
              {isXpLocked ? (
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={cn("font-semibold text-lg", isXpLocked && "text-muted-foreground")}>{chapter.title}</h3>
                  {isXpLocked && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <Lock className="h-3.5 w-3.5" />
                      נדרשים {requiredXp} XP לפתיחה
                    </span>
                  )}
                  {isAdminView && getStatusBadge(chapter.status)}
                  {isAdminView && getVisibilityBadge(chapter.visibility_mode, chapter.cohort, chapter.cohort_id)}
                </div>
                
                {chapter.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {chapter.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{lessons.length} שיעורים</span>
                  {!isAdminView && completedCount > 0 && (
                    <span>{completedCount}/{lessons.length} הושלמו</span>
                  )}
                  {isAdminView && (
                    <span>סדר: {chapter.order_index}</span>
                  )}
                </div>

                {!isAdminView && lessons.length > 0 && (
                  <Progress value={progressPercentage} className="w-32 h-2 mt-2" />
                )}
              </div>
            </div>

            {isAdminView && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLesson?.(chapter.id);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditChapter?.(chapter);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChapter?.(chapter);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t bg-muted/20">
            {lessons.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {isAdminView ? "אין שיעורים בפרק זה" : "אין שיעורים להצגה כרגע"}
                {!isAdminView && (
                  <p className="text-sm mt-2">תוכן הפרק יתווסף בקרוב</p>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  
                  return (
                    <div
                      key={lesson.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                    >
                      <div
                        className="flex items-center space-x-3 space-x-reverse flex-1 cursor-pointer"
                        onClick={() => {
                          if (isXpLocked) {
                            handleLockedLessonAttempt();
                            return;
                          }
                          onLessonClick?.(lesson);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {!isAdminView && isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {index + 1}. {lesson.title}
                            </h4>
                            {isAdminView && getStatusBadge(lesson.status)}
                            {isAdminView && getVisibilityBadge(lesson.visibility_mode, lesson.cohort, lesson.cohort_id)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {lesson.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {lesson.duration_sec && (
                              <span>{Math.ceil(lesson.duration_sec / 60)} דקות</span>
                            )}
                            {isAdminView && (
                              <span>סדר: {lesson.order_index}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isAdminView && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditLesson?.(lesson)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteLesson?.(lesson)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default ChapterAccordion;
