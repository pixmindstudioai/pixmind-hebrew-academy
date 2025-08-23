
import { useState } from 'react';
import { Plus, BookOpen, List, Play, Edit, Trash2, Eye, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ModuleForm from '@/components/admin/ModuleForm';
import ChapterForm from '@/components/admin/ChapterForm';
import LessonForm from '@/components/admin/LessonForm';
import { AdminModule, AdminChapter, AdminLesson } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const ContentPage = () => {
  const [activeTab, setActiveTab] = useState('modules');
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [showForm, setShowForm] = useState<{
    type: 'module' | 'chapter' | 'lesson' | null;
    editing?: AdminModule | AdminChapter | AdminLesson;
  }>({ type: null });
  const { toast } = useToast();

  // Module handlers
  const handleCreateModule = (data: any) => {
    const newModule: AdminModule = {
      id: `module-${Date.now()}`,
      title: data.title,
      description: data.description,
      order: modules.length,
      status: data.status || 'draft',
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: data.status === 'active' ? new Date() : undefined,
    };

    setModules(prev => [...prev, newModule]);
    setShowForm({ type: null });
    toast({
      title: "מודול נוצר בהצלחה",
      description: `המודול "${data.title}" נוצר במערכת`,
    });
  };

  const handleEditModule = (data: any) => {
    const editingModule = showForm.editing as AdminModule;
    if (!editingModule) return;

    setModules(prev => prev.map(module => 
      module.id === editingModule.id
        ? {
            ...module,
            title: data.title,
            description: data.description,
            status: data.status,
            updatedAt: new Date(),
            publishedAt: data.status === 'active' && module.status !== 'active' ? new Date() : module.publishedAt,
          }
        : module
    ));

    setShowForm({ type: null });
    toast({
      title: "מודול עודכן בהצלחה",
      description: `המודול "${data.title}" עודכן במערכת`,
    });
  };

  // Chapter handlers
  const handleCreateChapter = (data: any) => {
    const newChapter: AdminChapter = {
      id: `chapter-${Date.now()}`,
      moduleId: data.moduleId,
      title: data.title,
      description: data.description,
      order: data.order,
      status: data.status || 'draft',
      lessons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: data.status === 'active' ? new Date() : undefined,
    };

    setChapters(prev => [...prev, newChapter]);
    setShowForm({ type: null });
    toast({
      title: "פרק נוצר בהצלחה",
      description: `הפרק "${data.title}" נוצר במערכת`,
    });
  };

  const handleEditChapter = (data: any) => {
    const editingChapter = showForm.editing as AdminChapter;
    if (!editingChapter) return;

    setChapters(prev => prev.map(chapter => 
      chapter.id === editingChapter.id
        ? {
            ...chapter,
            title: data.title,
            description: data.description,
            status: data.status,
            order: data.order,
            updatedAt: new Date(),
            publishedAt: data.status === 'active' && chapter.status !== 'active' ? new Date() : chapter.publishedAt,
          }
        : chapter
    ));

    setShowForm({ type: null });
    toast({
      title: "פרק עודכן בהצלחה",
      description: `הפרק "${data.title}" עודכן במערכת`,
    });
  };

  // Lesson handlers
  const handleCreateLesson = (data: any) => {
    const newLesson: AdminLesson = {
      id: `lesson-${Date.now()}`,
      chapterId: data.chapterId,
      title: data.title,
      description: data.description,
      order: data.order,
      status: data.status || 'draft',
      video: data.video,
      embeds: data.embeds || [],
      richText: data.richText,
      attachments: data.attachments || [],
      durationSec: data.durationSec,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: data.status === 'active' ? new Date() : undefined,
    };

    setLessons(prev => [...prev, newLesson]);
    setShowForm({ type: null });
    toast({
      title: "שיעור נוצר בהצלחה",
      description: `השיעור "${data.title}" נוצר במערכת`,
    });
  };

  const handleEditLesson = (data: any) => {
    const editingLesson = showForm.editing as AdminLesson;
    if (!editingLesson) return;

    setLessons(prev => prev.map(lesson => 
      lesson.id === editingLesson.id
        ? {
            ...lesson,
            title: data.title,
            description: data.description,
            status: data.status,
            order: data.order,
            video: data.video,
            embeds: data.embeds || [],
            richText: data.richText,
            attachments: data.attachments || [],
            durationSec: data.durationSec,
            updatedAt: new Date(),
            publishedAt: data.status === 'active' && lesson.status !== 'active' ? new Date() : lesson.publishedAt,
          }
        : lesson
    ));

    setShowForm({ type: null });
    toast({
      title: "שיעור עודכן בהצלחה",
      description: `השיעור "${data.title}" עודכן במערכת`,
    });
  };

  const handleDelete = (type: 'module' | 'chapter' | 'lesson', id: string) => {
    if (type === 'module') {
      setModules(prev => prev.filter(m => m.id !== id));
      toast({ title: "מודול נמחק", description: "המודול נמחק מהמערכת" });
    } else if (type === 'chapter') {
      setChapters(prev => prev.filter(c => c.id !== id));
      toast({ title: "פרק נמחק", description: "הפרק נמחק מהמערכת" });
    } else if (type === 'lesson') {
      setLessons(prev => prev.filter(l => l.id !== id));
      toast({ title: "שיעור נמחק", description: "השיעור נמחק מהמערכת" });
    }
  };

  const getStatusBadge = (status: 'draft' | 'active' | 'archived') => {
    const variants = {
      draft: { variant: 'secondary' as const, text: 'טיוטה' },
      active: { variant: 'default' as const, text: 'פעיל' },
      archived: { variant: 'outline' as const, text: 'בארכיון' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (showForm.type) {
    if (showForm.type === 'module') {
      return (
        <ModuleForm
          module={showForm.editing as AdminModule}
          onSubmit={showForm.editing ? handleEditModule : handleCreateModule}
          onCancel={() => setShowForm({ type: null })}
        />
      );
    }
    
    if (showForm.type === 'chapter') {
      return (
        <ChapterForm
          chapter={showForm.editing as AdminChapter}
          modules={modules}
          onSubmit={showForm.editing ? handleEditChapter : handleCreateChapter}
          onCancel={() => setShowForm({ type: null })}
        />
      );
    }
    
    if (showForm.type === 'lesson') {
      return (
        <LessonForm
          lesson={showForm.editing as AdminLesson}
          chapters={chapters}
          onSubmit={showForm.editing ? handleEditLesson : handleCreateLesson}
          onCancel={() => setShowForm({ type: null })}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול תוכן</h2>
          <p className="text-muted-foreground">
            יצירה ועריכה של מודולים, פרקים ושיעורים
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules" className="gap-2">
            <BookOpen className="w-4 h-4" />
            מודולים ({modules.length})
          </TabsTrigger>
          <TabsTrigger value="chapters" className="gap-2">
            <List className="w-4 h-4" />
            פרקים ({chapters.length})
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <Play className="w-4 h-4" />
            שיעורים ({lessons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">רשימת מודולים</h3>
            <Button onClick={() => setShowForm({ type: 'module' })} className="gap-2">
              <Plus className="w-4 h-4" />
              מודול חדש
            </Button>
          </div>

          {modules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פרקים</TableHead>
                  <TableHead>עודכן</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.title}</TableCell>
                    <TableCell className="max-w-md truncate">{module.description}</TableCell>
                    <TableCell>{getStatusBadge(module.status)}</TableCell>
                    <TableCell>{module.chapters.length}</TableCell>
                    <TableCell>{module.updatedAt.toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">פעולות</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowForm({ type: 'module', editing: module })}>
                            <Edit className="w-4 h-4 ml-2" />
                            עריכה
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete('module', module.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחיקה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">לא נוצרו מודולים עדיין</p>
              <p>התחל ביצירת המודול הראשון שלך</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">רשימת פרקים</h3>
            <Button 
              onClick={() => setShowForm({ type: 'chapter' })} 
              className="gap-2"
              disabled={modules.length === 0}
            >
              <Plus className="w-4 h-4" />
              פרק חדש
            </Button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">יש ליצור מודול תחילה</p>
              <p>פרקים משויכים למודולים</p>
            </div>
          ) : chapters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>מודול</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>שיעורים</TableHead>
                  <TableHead>סדר</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter) => {
                  const module = modules.find(m => m.id === chapter.moduleId);
                  return (
                    <TableRow key={chapter.id}>
                      <TableCell className="font-medium">{chapter.title}</TableCell>
                      <TableCell>{module?.title || 'לא נמצא'}</TableCell>
                      <TableCell>{getStatusBadge(chapter.status)}</TableCell>
                      <TableCell>{chapter.lessons.length}</TableCell>
                      <TableCell>{chapter.order}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">פעולות</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowForm({ type: 'chapter', editing: chapter })}>
                              <Edit className="w-4 h-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete('chapter', chapter.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">לא נוצרו פרקים עדיין</p>
              <p>התחל ביצירת הפרק הראשון שלך</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">רשימת שיעורים</h3>
            <Button 
              onClick={() => setShowForm({ type: 'lesson' })} 
              className="gap-2"
              disabled={chapters.length === 0}
            >
              <Plus className="w-4 h-4" />
              שיעור חדש
            </Button>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">יש ליצור פרק תחילה</p>
              <p>שיעורים משויכים לפרקים</p>
            </div>
          ) : lessons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>פרק</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>וידאו</TableHead>
                  <TableHead>קבצים</TableHead>
                  <TableHead>סדר</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => {
                  const chapter = chapters.find(c => c.id === lesson.chapterId);
                  return (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell>{chapter?.title || 'לא נמצא'}</TableCell>
                      <TableCell>{getStatusBadge(lesson.status)}</TableCell>
                      <TableCell>
                        {lesson.video ? (
                          <Badge variant="outline">{lesson.video.provider}</Badge>
                        ) : (
                          <span className="text-muted-foreground">אין</span>
                        )}
                      </TableCell>
                      <TableCell>{lesson.attachments.length}</TableCell>
                      <TableCell>{lesson.order}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">פעולות</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowForm({ type: 'lesson', editing: lesson })}>
                              <Edit className="w-4 h-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete('lesson', lesson.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">לא נוצרו שיעורים עדיין</p>
              <p>התחל ביצירת השיעור הראשון שלך</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentPage;
