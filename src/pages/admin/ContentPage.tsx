
import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  useLessons,
  useCreateLesson,
  useUpdateLesson
} from '@/hooks/useAdminData';
import { toast } from 'sonner';

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
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  // Queries
  const { data: modules = [], isLoading: modulesLoading } = useModules();
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(selectedModule);
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons(selectedChapter);

  // Mutations
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'טיוטה', variant: 'secondary' as const },
      active: { label: 'פעיל', variant: 'default' as const },
      archived: { label: 'בארכיון', variant: 'outline' as const }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  const handleCreateChapter = (data: any) => {
    createChapter.mutate(data, {
      onSuccess: () => {
        setChapterDialogOpen(false);
        setEditingChapter(null);
      }
    });
  };

  const handleUpdateChapter = (data: any) => {
    if (editingChapter) {
      updateChapter.mutate({ id: editingChapter.id, ...data }, {
        onSuccess: () => {
          setChapterDialogOpen(false);
          setEditingChapter(null);
        }
      });
    }
  };

  const handleCreateLesson = (data: any) => {
    createLesson.mutate(data, {
      onSuccess: () => {
        setLessonDialogOpen(false);
        setEditingLesson(null);
      }
    });
  };

  const handleUpdateLesson = (data: any) => {
    if (editingLesson) {
      updateLesson.mutate({ id: editingLesson.id, ...data }, {
        onSuccess: () => {
          setLessonDialogOpen(false);
          setEditingLesson(null);
        }
      });
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'module') {
      deleteModule.mutate(itemToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }
      });
    }
    // Add delete handlers for chapters and lessons here
  };

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
            ניהול מודולים, פרקים ושיעורים
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
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>סדר</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{module.description}</TableCell>
                    <TableCell>{getStatusBadge(module.status)}</TableCell>
                    <TableCell>{module.order_index}</TableCell>
                    <TableCell>{new Date(module.created_at).toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedModule(module.id);
                              setActiveTab('chapters');
                            }}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            צפה בפרקים
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingModule(module);
                              setModuleDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            עריכה
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setItemToDelete({ type: 'module', id: module.id, name: module.title });
                              setDeleteDialogOpen(true);
                            }}
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
          </div>
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
                <Badge variant="outline">
                  מודול: {modules.find(m => m.id === selectedModule)?.title}
                </Badge>
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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>כותרת</TableHead>
                    <TableHead>תיאור</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>סדר</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell className="font-medium">{chapter.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{chapter.description || 'ללא תיאור'}</TableCell>
                      <TableCell>{getStatusBadge(chapter.status)}</TableCell>
                      <TableCell>{chapter.order_index}</TableCell>
                      <TableCell>{new Date(chapter.created_at).toLocaleDateString('he-IL')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedChapter(chapter.id);
                                setActiveTab('lessons');
                              }}
                            >
                              <Eye className="w-4 h-4 ml-2" />
                              צפה בשיעורים
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingChapter(chapter);
                                setChapterDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              בחר מודול כדי לצפות בפרקים שלו
            </div>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          {/* Similar structure for lessons */}
          {selectedChapter ? (
            <div className="text-center">
              <p>שיעורים יוצגו כאן</p>
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
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'עריכת מודול' : 'יצירת מודול חדש'}
            </DialogTitle>
          </DialogHeader>
          <ModuleForm
            module={editingModule}
            onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
            onCancel={() => setModuleDialogOpen(false)}
            isLoading={createModule.isPending || updateModule.isPending}
          />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את "{itemToDelete?.name}" לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentPage;
