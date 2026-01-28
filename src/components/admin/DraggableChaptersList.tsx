import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, Edit, Trash2, Plus, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Chapter, Lesson } from '@/hooks/useContentData';
import { cn } from '@/lib/utils';

interface Cohort {
  id: string;
  name: string;
}

interface DraggableChaptersListProps {
  chapters: (Chapter & { cohort?: Cohort | null })[];
  lessons: any[];
  cohortMap: Record<string, { id: string; name: string }>;
  onReorder: (chapters: Chapter[]) => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapter: Chapter) => void;
  onAddLesson: (chapterId: string) => void;
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lesson: any) => void;
}

interface SortableChapterItemProps {
  chapter: Chapter & { cohort?: Cohort | null };
  lessons: any[];
  isDragging?: boolean;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapter: Chapter) => void;
  onAddLesson: (chapterId: string) => void;
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lesson: any) => void;
}

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: 'טיוטה', variant: 'secondary' as const },
    active: { label: 'פעיל', variant: 'default' as const },
    archived: { label: 'בארכיון', variant: 'outline' as const }
  };
  
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
};

const getVisibilityBadge = (visibilityMode?: string, cohort?: Cohort | null) => {
  if (!visibilityMode || visibilityMode === 'all') {
    return (
      <Badge variant="outline" className="text-xs gap-1 bg-green-500/10 text-green-600 border-green-500/30">
        <Users className="w-3 h-3" />
        לכל התלמידים
      </Badge>
    );
  }
  
  if (visibilityMode === 'cohort' && cohort?.name) {
    return (
      <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
        <Eye className="w-3 h-3" />
        מחזור: {cohort.name}
      </Badge>
    );
  }
  
  return null;
};

const SortableChapterItem = ({
  chapter,
  lessons,
  isDragging,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: SortableChapterItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const chapterLessons = lessons.filter(l => l.chapter_id === chapter.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border rounded-lg bg-card overflow-hidden transition-shadow',
        (isDragging || isSorting) && 'shadow-lg opacity-90 ring-2 ring-primary'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center p-4 hover:bg-muted/50 transition-colors">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-2 -mr-2 cursor-grab active:cursor-grabbing touch-none"
            aria-label="גרור לשינוי סדר"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Chapter Content */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center flex-1 cursor-pointer mr-2">
              <ChevronDown 
                className={cn(
                  'w-5 h-5 transition-transform ml-2',
                  isOpen && 'rotate-180'
                )} 
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-lg">{chapter.title}</h3>
                  {getStatusBadge(chapter.status)}
                  {getVisibilityBadge(chapter.visibility_mode, chapter.cohort)}
                </div>
                
                {chapter.description && (
                  <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                    {chapter.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{chapterLessons.length} שיעורים</span>
                  <span className="text-primary font-medium">סדר: {chapter.order_index}</span>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddLesson(chapter.id)}
              title="הוסף שיעור"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditChapter(chapter)}
              title="ערוך פרק"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteChapter(chapter)}
              className="text-destructive hover:text-destructive"
              title="מחק פרק"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t bg-muted/20">
            {chapterLessons.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                אין שיעורים בפרק זה
              </div>
            ) : (
              <div className="divide-y">
                {chapterLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {getStatusBadge(lesson.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditLesson(lesson)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLesson(lesson)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const DraggableChaptersList = ({
  chapters,
  lessons,
  cohortMap,
  onReorder,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: DraggableChaptersListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex(c => c.id === active.id);
      const newIndex = chapters.findIndex(c => c.id === over.id);
      
      const reorderedChapters = arrayMove(chapters, oldIndex, newIndex).map(
        (chapter, index) => ({
          ...chapter,
          order_index: index,
        })
      );
      
      onReorder(reorderedChapters);
    }
  };

  const activeChapter = activeId 
    ? chapters.find(c => c.id === activeId) 
    : null;

  // Enrich chapters with cohort data
  const enrichedChapters = chapters.map(chapter => ({
    ...chapter,
    cohort: chapter.cohort_id ? cohortMap[chapter.cohort_id] || null : null,
  }));

  // Enrich lessons with cohort data
  const enrichedLessons = lessons.map(lesson => ({
    ...lesson,
    cohort: lesson.cohort_id ? cohortMap[lesson.cohort_id] || null : null,
  }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={enrichedChapters.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {enrichedChapters.map(chapter => (
            <SortableChapterItem
              key={chapter.id}
              chapter={chapter}
              lessons={enrichedLessons.filter(l => l.chapter_id === chapter.id)}
              onEditChapter={onEditChapter}
              onDeleteChapter={onDeleteChapter}
              onAddLesson={onAddLesson}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeChapter ? (
          <div className="border rounded-lg bg-card p-4 shadow-xl ring-2 ring-primary opacity-90">
            <div className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">{activeChapter.title}</h3>
              {getStatusBadge(activeChapter.status)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DraggableChaptersList;
