
import { ChevronDown, Play, CheckCircle, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Chapter, Lesson } from "@/hooks/useContentData";
import { useState } from "react";

interface ChapterAccordionProps {
  chapter: Chapter;
  lessons: Lesson[];
  completedLessons?: string[];
  isAdminView?: boolean;
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
  onLessonClick,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: ChapterAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const completedCount = lessons.filter(lesson => 
    completedLessons.includes(lesson.id)
  ).length;
  const progressPercentage = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'טיוטה', variant: 'secondary' as const },
      active: { label: 'פעיל', variant: 'default' as const },
      archived: { label: 'בארכיון', variant: 'outline' as const }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg glass-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 space-x-reverse flex-1">
              <ChevronDown 
                className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{chapter.title}</h3>
                  {isAdminView && getStatusBadge(chapter.status)}
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
                {isAdminView ? "אין שיעורים בפרק זה" : "הפרק עדיין לא מכיל שיעורים"}
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
                        onClick={() => onLessonClick?.(lesson)}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {!isAdminView && isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {index + 1}. {lesson.title}
                            </h4>
                            {isAdminView && getStatusBadge(lesson.status)}
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
