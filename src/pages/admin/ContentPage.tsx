
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ModuleCard from '@/components/shared/ModuleCard';
import ChapterAccordion from '@/components/shared/ChapterAccordion';
import ModuleForm from '@/components/admin/ModuleForm';
import ChapterForm from '@/components/admin/ChapterForm';
import LessonForm from '@/components/admin/LessonForm';
import { 
  useModules, 
  useCreateModule, 
  useUpdateModule, 
  useDeleteModule,
  useChapters,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson
} from '@/hooks/useAdminData';
import { Module, Chapter, Lesson } from '@/hooks/useContentData';
import { AdminModule, AdminChapter, AdminLesson } from '@/types/admin';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';

// Transform database types to admin types
const transformToAdminChapter = (chapter: Chapter): AdminChapter => ({
  id: chapter.id,
  moduleId: chapter.module_id,
  title: chapter.title,
  description: chapter.description || '',
  order: chapter.order_index,
  status: chapter.status,
  lessons: [],
  createdAt: new Date(chapter.created_at),
  updatedAt: new Date(chapter.updated_at),
  publishedAt: chapter.published_at ? new Date(chapter.published_at) : undefined,
  visibility_mode: chapter.visibility_mode,
  cohort_id: chapter.cohort_id,
});

const transformToAdminLesson = (lesson: Lesson): AdminLesson => ({
  id: lesson.id,
  chapterId: lesson.chapter_id,
  title: lesson.title,
  description: lesson.description,
  order: lesson.order_index,
  status: lesson.status,
  video: lesson.video_url ? {
    provider: lesson.video_provider || 'youtube',
    url: lesson.video_url,
    videoId: lesson.video_id,
    startTime: lesson.video_start_time,
    thumbnail: lesson.video_thumbnail,
  } : undefined,
  embeds: (lesson as any).embeds && Array.isArray((lesson as any).embeds) ? (lesson as any).embeds : [],
  attachments: (lesson as any).attachments && Array.isArray((lesson as any).attachments) 
    ? (lesson as any).attachments.map((att: any) => ({
        id: att.id || `att-${Date.now()}-${Math.random()}`,
        lessonId: lesson.id,
        name: att.name,
        url: att.url,
        mime: att.type || att.mime,
        size: att.size,
        kind: att.kind || 'other',
        uploadedAt: new Date(att.uploadedAt || Date.now())
      }))
    : [],
  links: (lesson as any).links && Array.isArray((lesson as any).links) ? (lesson as any).links : [],
  richText: lesson.rich_text,
  durationSec: lesson.duration_sec,
  thumbnailUrl: lesson.thumbnail_url,
  createdAt: new Date(lesson.created_at),
  updatedAt: new Date(lesson.updated_at),
  publishedAt: lesson.published_at ? new Date(lesson.published_at) : undefined,
  visibility_mode: lesson.visibility_mode,
  cohort_id: lesson.cohort_id,
});

const ContentPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('modules');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  
  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  // Queries with real-time updates
  const { data: modules = [], isLoading: modulesLoading } = useModules();
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(selectedModule);
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons(selectedChapter);

  // Mutations
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  // Module handlers
  const handleCreateModule = (data: any) => {
    createModule.mutate(data, {
      onSuccess: () => {
        setModuleDialogOpen(false);
        setEditingModule(null);
      }
    });
  };

  const handleUpdateModule = (data: any) => {
    if (editingModule) {
      updateModule.mutate({ id: editingModule.id, ...data }, {
        onSuccess: () => {
          setModuleDialogOpen(false);
          setEditingModule(null);
        }
      });
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleDialogOpen(true);
  };

  const handleDeleteModule = (module: Module) => {
    setItemToDelete({ type: 'module', id: module.id, name: module.title });
    setDeleteDialogOpen(true);
  };

  const handleViewModule = (module: Module) => {
    setSelectedModule(module.id);
    setActiveTab('chapters');
  };

  // Chapter handlers
  const handleCreateChapter = (data: any) => {
    createChapter.mutate({ 
      ...data, 
      module_id: selectedModule,
      visibility_mode: data.visibility_mode || 'all',
      cohort_id: data.cohort_id || null,
    }, {
      onSuccess: () => {
        setChapterDialogOpen(false);
        setEditingChapter(null);
      }
    });
  };

  const handleUpdateChapter = (data: any) => {
    if (editingChapter) {
      updateChapter.mutate({ 
        id: editingChapter.id, 
        ...data,
        visibility_mode: data.visibility_mode || 'all',
        cohort_id: data.cohort_id || null,
      }, {
        onSuccess: () => {
          setChapterDialogOpen(false);
          setEditingChapter(null);
        }
      });
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterDialogOpen(true);
  };

  const handleDeleteChapter = (chapter: Chapter) => {
    setItemToDelete({ type: 'chapter', id: chapter.id, name: chapter.title });
    setDeleteDialogOpen(true);
  };

  const handleViewChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter.id);
    setActiveTab('lessons');
  };

  // Lesson handlers
  const handleCreateLesson = (data: any) => {
    console.log('Raw lesson form data:', data);
    
    // Transform form data to match database schema
    const { video, embeds, attachments, order, visibility_mode, cohort_id, ...restData } = data;
    
    const lessonData: any = {
      ...restData,
      visibility_mode: visibility_mode || 'inherit',
      cohort_id: cohort_id || null,
      // Don't send order_index - let the backend calculate it automatically
    };
    
    // Transform video object to individual database columns
    if (video) {
      lessonData.video_provider = video.provider;
      lessonData.video_url = video.url;
      lessonData.video_id = video.videoId;
      lessonData.video_start_time = video.startTime;
      lessonData.video_thumbnail = video.thumbnail;
    }
    
    // Add JSONB fields
    if (embeds) lessonData.embeds = embeds;
    if (attachments) lessonData.attachments = attachments;
    
    console.log('Transformed lesson data for database (order_index will be auto-calculated):', lessonData);
    
    createLesson.mutate(lessonData, {
      onSuccess: (newLesson) => {
        console.log('Lesson created successfully with order_index:', newLesson.order_index);
        setLessonDialogOpen(false);
        setEditingLesson(null);
        toast.success(`השיעור נוצר בהצלחה במיקום ${newLesson.order_index + 1} בפרק`);
      },
      onError: (error) => {
        console.error('שגיאה ביצירת השיעור:', error);
        if (error.message.includes('duplicate key') && error.message.includes('order_index')) {
          toast.error('שגיאה: מספר סדר (order) כבר קיים בפרק זה');
        } else {
          toast.error(`שגיאה ביצירת השיעור: ${error.message}`);
        }
      }
    });
  };

  const handleUpdateLesson = (data: any) => {
    if (!editingLesson) return;
    
    const { video, embeds, attachments, links, visibility_mode, cohort_id, ...formData } = data;
    
    // Validate required fields
    if (!formData.title?.trim()) {
      toast.error('כותרת השיעור נדרשת');
      return;
    }
    
    if (!formData.description?.trim()) {
      toast.error('תיאור השיעור נדרש');
      return;
    }
    
    if (!formData.chapter_id) {
      toast.error('יש לבחור פרק');
      return;
    }

    // Transform camelCase to snake_case for database
    const lessonData: any = {
      id: editingLesson.id,
      chapter_id: formData.chapter_id,
      title: formData.title,
      description: formData.description,
      order_index: formData.order || 0,
      status: formData.status,
      duration_sec: formData.duration_sec,
      rich_text: formData.rich_text,
      thumbnail_url: formData.thumbnail_url,
      visibility_mode: visibility_mode || 'inherit',
      cohort_id: cohort_id || null,
    };
    
    // Handle video data
    if (video) {
      lessonData.video_provider = video.provider;
      lessonData.video_url = video.url;
      lessonData.video_id = video.videoId;
      lessonData.video_start_time = video.startTime;
      lessonData.video_thumbnail = video.thumbnail;
    }
    
    // Add JSONB fields
    if (embeds && Array.isArray(embeds)) {
      lessonData.embeds = embeds;
    }
    if (attachments && Array.isArray(attachments)) {
      lessonData.attachments = attachments;
    }
    if (links && Array.isArray(links)) {
      lessonData.links = links;
    }
    
    console.log('Updating lesson with data:', lessonData);
    
    updateLesson.mutate(lessonData, {
      onSuccess: () => {
        setLessonDialogOpen(false);
        setEditingLesson(null);
        toast.success('השיעור עודכן בהצלחה');
      },
      onError: (error) => {
        console.error('שגיאה בעדכון השיעור:', error);
        toast.error(`שגיאה בעדכון השיעור: ${error.message}`);
      }
    });
  };

  const handleEditLesson = (lesson: any) => {
    // Cast the lesson with proper types
    const castLesson = {
      ...lesson,
      links: lesson.links && Array.isArray(lesson.links) 
        ? lesson.links as Array<{label: string; url: string}> 
        : null,
      attachments: lesson.attachments && Array.isArray(lesson.attachments) 
        ? lesson.attachments as Array<{name: string; url: string; type: string; size: number}>
        : null,
    } as Lesson;
    
    setEditingLesson(castLesson);
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = (lesson: any) => {
    // Cast the lesson with proper types  
    const castLesson = {
      ...lesson,
      links: lesson.links && Array.isArray(lesson.links) 
        ? lesson.links as Array<{label: string; url: string}> 
        : null,
      attachments: lesson.attachments && Array.isArray(lesson.attachments) 
        ? lesson.attachments as Array<{name: string; url: string; type: string; size: number}>
        : null,
    } as Lesson;
    
    setItemToDelete({ type: 'lesson', id: castLesson.id, name: castLesson.title });
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'module') {
      deleteModule.mutate(itemToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
        onError: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }
      });
    } else if (itemToDelete.type === 'chapter') {
      const chapter = chapters.find(c => c.id === itemToDelete.id);
      if (chapter) {
        deleteChapter.mutate({ id: itemToDelete.id, module_id: chapter.module_id }, {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            // Clear lessons list if we were viewing this chapter's lessons
            if (selectedChapter === itemToDelete.id) {
              setSelectedChapter('');
              setActiveTab('chapters');
            }
          },
          onError: () => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        });
      }
    } else if (itemToDelete.type === 'lesson') {
      const lesson = lessons.find(l => l.id === itemToDelete.id);
      if (lesson) {
        deleteLesson.mutate({ id: itemToDelete.id, chapter_id: lesson.chapter_id }, {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          },
          onError: () => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        });
      }
    }
  };

  // Filter functions
  const filteredModules = modules.filter(module => 
    module.title.includes(searchTerm) || module.description.includes(searchTerm)
  );

  const filteredChapters = chapters.filter(chapter => 
    chapter.title.includes(searchTerm) || (chapter.description && chapter.description.includes(searchTerm))
  );

  const filteredLessons = lessons.filter(lesson => 
    lesson.title.includes(searchTerm) || lesson.description.includes(searchTerm)
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ניהול תוכן</h1>
          <p className="text-muted-foreground">
            ניהול מודולים, פרקים ושיעורים עם עדכונים בזמן אמת
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">מודולים</TabsTrigger>
          <TabsTrigger value="chapters">פרקים</TabsTrigger>
          <TabsTrigger value="lessons">שיעורים</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש מודולים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <AuthenticationGuard message="לא ניתן ליצור מודול – יש להתחבר תחילה">
              <Button 
                onClick={() => {
                  setEditingModule(null);
                  setModuleDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                מודול חדש
              </Button>
            </AuthenticationGuard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                lessonsCount={0} // This would be calculated
                isAdminView
                onEdit={handleEditModule}
                onDelete={handleDeleteModule}
                onView={handleViewModule}
                onClick={handleViewModule}
              />
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'לא נמצאו מודולים המתאימים לחיפוש' : 'עדיין אין מודולים'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש פרקים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              {selectedModule && (
                <div className="font-bold">
                  מודול: {modules.find(m => m.id === selectedModule)?.title}
                </div>
              )}
            </div>
            <Button 
              onClick={() => {
                setEditingChapter(null);
                setChapterDialogOpen(true);
              }}
              disabled={!selectedModule}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              פרק חדש
            </Button>
          </div>

          {selectedModule ? (
            <div className="space-y-4">
              {filteredChapters.map((chapter) => (
                <ChapterAccordion
                  key={chapter.id}
                  chapter={chapter}
                  lessons={lessons.filter(lesson => lesson.chapter_id === chapter.id).map(lesson => ({
                    ...lesson,
                    links: lesson.links && Array.isArray(lesson.links) 
                      ? lesson.links as Array<{label: string; url: string}> 
                      : null,
                    attachments: lesson.attachments && Array.isArray(lesson.attachments) 
                      ? lesson.attachments as Array<{name: string; url: string; type: string; size: number}>
                      : null,
                  })) as any[]}
                  isAdminView
                  onEditChapter={handleEditChapter}
                  onDeleteChapter={handleDeleteChapter}
                  onAddLesson={() => {
                    setSelectedChapter(chapter.id);
                    setLessonDialogOpen(true);
                  }}
                  onEditLesson={handleEditLesson}
                  onDeleteLesson={handleDeleteLesson}
                />
              ))}

              {filteredChapters.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'לא נמצאו פרקים המתאימים לחיפוש' : 'עדיין אין פרקים במודול זה'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              בחר מודול כדי לצפות בפרקים שלו
            </div>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש שיעורים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              {selectedChapter && (
                <div className="font-bold">
                  פרק: {chapters.find(c => c.id === selectedChapter)?.title}
                </div>
              )}
            </div>
            <Button 
              onClick={() => {
                setEditingLesson(null);
                setLessonDialogOpen(true);
              }}
              disabled={!selectedChapter}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              שיעור חדש
            </Button>
          </div>

          {selectedChapter ? (
            <div className="space-y-4">
              {filteredLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLesson(lesson)}
                    >
                      עריכה
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson)}
                      className="text-destructive hover:text-destructive"
                    >
                      מחיקה
                    </Button>
                  </div>
                </div>
              ))}

              {filteredLessons.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'לא נמצאו שיעורים המתאימים לחיפוש' : 'עדיין אין שיעורים בפרק זה'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              בחר פרק כדי לצפות בשיעורים שלו
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" dir="rtl">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold">
              {editingModule ? 'עריכת מודול' : 'יצירת מודול חדש'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[calc(90vh-120px)]">
            <AuthenticationGuard message="נדרשת הרשאה לניהול מודולים">
              <ModuleForm
                module={editingModule}
                onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
                onCancel={() => setModuleDialogOpen(false)}
                isLoading={createModule.isPending || updateModule.isPending}
                showActions={false}
              />
            </AuthenticationGuard>
          </div>
          
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-6 py-4 z-50">
            <div className="flex gap-3">
              <AuthenticationGuard message="נדרשת הרשאה לניהול מודולים">
                <button
                  type="submit"
                  form="module-form"
                  disabled={createModule.isPending || updateModule.isPending}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createModule.isPending || updateModule.isPending ? 'שומר...' : editingModule ? 'עדכון מודול' : 'יצירת מודול'}
                </button>
              </AuthenticationGuard>
              <button
                type="button"
                onClick={() => setModuleDialogOpen(false)}
                disabled={createModule.isPending || updateModule.isPending}
                className="px-6 py-2 border border-border hover:bg-accent text-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ביטול
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingChapter ? 'עריכת פרק' : 'יצירת פרק חדש'}
            </DialogTitle>
          </DialogHeader>
          <ChapterForm
            chapter={editingChapter}
            modules={modules}
            onSubmit={editingChapter ? handleUpdateChapter : handleCreateChapter}
            onCancel={() => setChapterDialogOpen(false)}
            isLoading={createChapter.isPending || updateChapter.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'עריכת שיעור' : 'יצירת שיעור חדש'}
            </DialogTitle>
          </DialogHeader>
          <LessonForm
            lesson={editingLesson ? transformToAdminLesson(editingLesson) : undefined}
            chapters={chapters.map(transformToAdminChapter)}
            onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
            onCancel={() => setLessonDialogOpen(false)}
            isLoading={createLesson.isPending || updateLesson.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקה?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {itemToDelete?.type === 'chapter' && (
                <>
                  <div className="font-semibold text-destructive">
                    מחיקת פרק תסיר גם את כל השיעורים והמידע הקשור. הפעולה אינה ניתנת לשחזור.
                  </div>
                  <div>
                    פעולה זו תמחק את הפרק "{itemToDelete?.name}" וכל השיעורים שבו לצמיתות.
                  </div>
                </>
              )}
              {itemToDelete?.type === 'lesson' && (
                <>
                  <div className="font-semibold text-destructive">
                    האם למחוק את השיעור? הפעולה אינה ניתנת לשחזור.
                  </div>
                  <div>
                    פעולה זו תמחק את השיעור "{itemToDelete?.name}" לצמיתות.
                  </div>
                </>
              )}
              {itemToDelete?.type === 'module' && (
                <>
                  <div className="font-semibold text-destructive">
                    הפעולה אינה ניתנת לשחזור.
                  </div>
                  <div>
                    פעולה זו תמחק את המודול "{itemToDelete?.name}" וכל הפרקים והשיעורים שבו לצמיתות.
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteModule.isPending || deleteChapter.isPending || deleteLesson.isPending}
            >
              בטל
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteModule.isPending || deleteChapter.isPending || deleteLesson.isPending}
            >
              {(deleteModule.isPending || deleteChapter.isPending || deleteLesson.isPending) ? 'מוחק...' : 'מחק'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentPage;
