import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Image,
  MessageSquare,
  Users,
  BookOpen,
  Filter,
  MoreVertical,
  Check,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  useAllTasks, 
  useTaskSubmissions, 
  useUpsertLessonTask,
  useOverrideSubmission,
  getEffectiveStatus
} from '@/hooks/useTasksData';
import { useAuth } from '@/hooks/useAuth';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';

interface TaskWithLesson {
  id: string;
  lesson_id: string;
  instructions: string;
  allowed_types: string[];
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lessons: {
    id: string;
    title: string;
    chapter_id: string;
    chapters: {
      id: string;
      title: string;
      module_id: string;
      modules: {
        id: string;
        title: string;
      };
    };
  };
}

interface GroupedTasks {
  [moduleId: string]: {
    module: { id: string; title: string };
    chapters: {
      [chapterId: string]: {
        chapter: { id: string; title: string };
        tasks: TaskWithLesson[];
      };
    };
  };
}

const TasksPage = () => {
  const { data: tasks = [], isLoading } = useAllTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [mandatoryFilter, setMandatoryFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  // Edit dialog state
  const [editingTask, setEditingTask] = useState<TaskWithLesson | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Submissions dialog state
  const [viewingSubmissionsTask, setViewingSubmissionsTask] = useState<TaskWithLesson | null>(null);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  
  const updateTask = useUpsertLessonTask();
  
  // Group tasks by module -> chapter
  const groupedTasks = useMemo(() => {
    const filtered = (tasks as TaskWithLesson[]).filter(task => {
      const matchesSearch = 
        task.lessons?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.instructions?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.lessons?.chapters?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.lessons?.chapters?.modules?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && task.is_active) ||
        (statusFilter === 'inactive' && !task.is_active);
      
      const matchesMandatory =
        mandatoryFilter === 'all' ||
        (mandatoryFilter === 'mandatory' && task.is_mandatory) ||
        (mandatoryFilter === 'optional' && !task.is_mandatory);
      
      return matchesSearch && matchesStatus && matchesMandatory;
    });
    
    const grouped: GroupedTasks = {};
    
    filtered.forEach(task => {
      const moduleId = task.lessons?.chapters?.module_id;
      const chapterId = task.lessons?.chapter_id;
      
      if (!moduleId || !chapterId) return;
      
      if (!grouped[moduleId]) {
        grouped[moduleId] = {
          module: task.lessons.chapters.modules,
          chapters: {},
        };
      }
      
      if (!grouped[moduleId].chapters[chapterId]) {
        grouped[moduleId].chapters[chapterId] = {
          chapter: task.lessons.chapters,
          tasks: [],
        };
      }
      
      grouped[moduleId].chapters[chapterId].tasks.push(task);
    });
    
    return grouped;
  }, [tasks, searchQuery, statusFilter, mandatoryFilter]);
  
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };
  
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };
  
  const handleEditTask = (task: TaskWithLesson) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };
  
  const handleViewSubmissions = (task: TaskWithLesson) => {
    setViewingSubmissionsTask(task);
    setSubmissionsDialogOpen(true);
  };
  
  const handleToggleActive = async (task: TaskWithLesson) => {
    await updateTask.mutateAsync({
      id: task.id,
      lesson_id: task.lesson_id,
      instructions: task.instructions,
      allowed_types: task.allowed_types,
      is_mandatory: task.is_mandatory,
      is_active: !task.is_active,
    });
    toast.success(task.is_active ? 'המשימה הושבתה' : 'המשימה הופעלה');
  };
  
  const handleToggleMandatory = async (task: TaskWithLesson) => {
    await updateTask.mutateAsync({
      id: task.id,
      lesson_id: task.lesson_id,
      instructions: task.instructions,
      allowed_types: task.allowed_types,
      is_mandatory: !task.is_mandatory,
      is_active: task.is_active,
    });
    toast.success(task.is_mandatory ? 'המשימה כעת אופציונלית' : 'המשימה כעת חובה');
  };
  
  const totalTasks = tasks.length;
  const activeTasks = (tasks as TaskWithLesson[]).filter(t => t.is_active).length;
  const mandatoryTasks = (tasks as TaskWithLesson[]).filter(t => t.is_mandatory).length;
  
  return (
    <AuthenticationGuard>
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">ניהול משימות</h1>
              <p className="text-muted-foreground">ניהול כל המשימות והגשות בקורסים</p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              הוספת משימה
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Card className="px-4 py-2">
              <div className="text-sm text-muted-foreground">סה"כ משימות</div>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </Card>
            <Card className="px-4 py-2">
              <div className="text-sm text-muted-foreground">פעילות</div>
              <div className="text-2xl font-bold text-green-500">{activeTasks}</div>
            </Card>
            <Card className="px-4 py-2">
              <div className="text-sm text-muted-foreground">חובה</div>
              <div className="text-2xl font-bold text-orange-500">{mandatoryTasks}</div>
            </Card>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם שיעור, פרק או קורס..."
              className="pr-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="active">פעילות</SelectItem>
                <SelectItem value="inactive">לא פעילות</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={mandatoryFilter} onValueChange={(v: any) => setMandatoryFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="mandatory">חובה</SelectItem>
                <SelectItem value="optional">רשות</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Tasks List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : Object.keys(groupedTasks).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">לא נמצאו משימות</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || mandatoryFilter !== 'all'
                  ? 'נסה לשנות את הסינון'
                  : 'אין משימות במערכת עדיין'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([moduleId, moduleData]) => (
              <Card key={moduleId}>
                <Collapsible 
                  open={expandedModules.has(moduleId)} 
                  onOpenChange={() => toggleModule(moduleId)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">{moduleData.module.title}</CardTitle>
                          <Badge variant="outline">
                            {Object.values(moduleData.chapters).reduce((acc, ch) => acc + ch.tasks.length, 0)} משימות
                          </Badge>
                        </div>
                        {expandedModules.has(moduleId) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {Object.entries(moduleData.chapters).map(([chapterId, chapterData]) => (
                        <Collapsible
                          key={chapterId}
                          open={expandedChapters.has(chapterId)}
                          onOpenChange={() => toggleChapter(chapterId)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{chapterData.chapter.title}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {chapterData.tasks.length} משימות
                                </Badge>
                              </div>
                              {expandedChapters.has(chapterId) ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="mt-2 mr-4 space-y-2">
                              {chapterData.tasks.map(task => (
                                <TaskItem 
                                  key={task.id} 
                                  task={task}
                                  onEdit={() => handleEditTask(task)}
                                  onViewSubmissions={() => handleViewSubmissions(task)}
                                  onToggleActive={() => handleToggleActive(task)}
                                  onToggleMandatory={() => handleToggleMandatory(task)}
                                />
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
        
        {/* Add Task Dialog */}
        <AddTaskDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
        
        {/* Edit Task Dialog */}
        <EditTaskDialog
          task={editingTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
        
        {/* Submissions Dialog */}
        <SubmissionsDialog
          task={viewingSubmissionsTask}
          open={submissionsDialogOpen}
          onOpenChange={setSubmissionsDialogOpen}
        />
      </div>
    </AuthenticationGuard>
  );
};

interface TaskItemProps {
  task: TaskWithLesson;
  onEdit: () => void;
  onViewSubmissions: () => void;
  onToggleActive: () => void;
  onToggleMandatory: () => void;
}

const TaskItem = ({ task, onEdit, onViewSubmissions, onToggleActive, onToggleMandatory }: TaskItemProps) => {
  const { data: submissions = [] } = useTaskSubmissions(task.id);
  
  const approvedCount = submissions.filter(s => getEffectiveStatus(s) === 'approved').length;
  const pendingCount = submissions.filter(s => getEffectiveStatus(s) === 'pending').length;
  const rejectedCount = submissions.filter(s => getEffectiveStatus(s) === 'rejected').length;
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageSquare className="w-3 h-3" />;
      case 'file': return <FileText className="w-3 h-3" />;
      case 'image': return <Image className="w-3 h-3" />;
      default: return null;
    }
  };
  
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{task.lessons.title}</span>
          
          <Badge variant={task.is_active ? 'default' : 'secondary'}>
            {task.is_active ? 'פעילה' : 'לא פעילה'}
          </Badge>
          
          {task.is_mandatory && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              חובה
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
          {task.instructions}
        </p>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">סוגי הגשה:</span>
            <div className="flex gap-1">
              {task.allowed_types.map(type => (
                <Badge key={type} variant="outline" className="gap-1 text-xs">
                  {getTypeIcon(type)}
                  {type === 'text' ? 'טקסט' : type === 'file' ? 'קובץ' : 'תמונה'}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="w-3 h-3" />
              {approvedCount}
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
              <Clock className="w-3 h-3" />
              {pendingCount}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <XCircle className="w-3 h-3" />
              {rejectedCount}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewSubmissions}>
          <Users className="w-4 h-4 ml-1" />
          הגשות ({submissions.length})
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              עריכת משימה
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {task.is_active ? 'השבת משימה' : 'הפעל משימה'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleMandatory}>
              {task.is_mandatory ? 'הפוך לאופציונלית' : 'הפוך לחובה'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

interface EditTaskDialogProps {
  task: TaskWithLesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTaskDialog = ({ task, open, onOpenChange }: EditTaskDialogProps) => {
  const [instructions, setInstructions] = useState('');
  const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
  const [isMandatory, setIsMandatory] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const updateTask = useUpsertLessonTask();
  
  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open && task) {
      setInstructions(task.instructions);
      setAllowedTypes(task.allowed_types);
      setIsMandatory(task.is_mandatory);
      setIsActive(task.is_active);
    }
  }, [open, task]);

  const handleMandatoryChange = (checked: boolean) => {
    setIsMandatory((prev) => (prev === checked ? prev : checked));
  };

  const handleActiveChange = (checked: boolean) => {
    setIsActive((prev) => (prev === checked ? prev : checked));
  };
  
  const handleSave = async () => {
    if (!task) return;
    
    await updateTask.mutateAsync({
      id: task.id,
      lesson_id: task.lesson_id,
      instructions,
      allowed_types: allowedTypes,
      is_mandatory: isMandatory,
      is_active: isActive,
    });
    
    toast.success('המשימה עודכנה בהצלחה');
    onOpenChange(false);
  };
  
  const toggleType = (type: string) => {
    setAllowedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>עריכת משימה</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {task && (
            <div className="text-sm text-muted-foreground">
              שיעור: {task.lessons.title}
            </div>
          )}
          
          <div className="space-y-2">
            <Label>הוראות המשימה</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="הוראות המשימה..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>סוגי הגשה מותרים</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowedTypes.includes('text')}
                  onCheckedChange={() => toggleType('text')}
                />
                <span>טקסט</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowedTypes.includes('file')}
                  onCheckedChange={() => toggleType('file')}
                />
                <span>קובץ</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowedTypes.includes('image')}
                  onCheckedChange={() => toggleType('image')}
                />
                <span>תמונה</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label>משימת חובה (חוסמת התקדמות)</Label>
            <Switch checked={isMandatory} onCheckedChange={handleMandatoryChange} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>משימה פעילה</Label>
            <Switch checked={isActive} onCheckedChange={handleActiveChange} />
          </div>
          
          {isMandatory && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline ml-2 text-orange-500" />
              שיעור זה כולל משימה חובה שחוסמת התקדמות. התלמידים לא יוכלו להמשיך לשיעור הבא עד שהמשימה תאושר.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={updateTask.isPending}>
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTaskDialog = ({ open, onOpenChange }: AddTaskDialogProps) => {
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['text']);
  const [isMandatory, setIsMandatory] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [lessonsSearch, setLessonsSearch] = useState('');
  
  const createTask = useUpsertLessonTask();
  
  // Fetch lessons that don't have tasks yet
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons-without-tasks'],
    queryFn: async () => {
      // Get all lessons
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          chapter_id,
          chapters!inner (
            id,
            title,
            module_id,
            modules!inner (
              id,
              title
            )
          )
        `)
        .order('title');
      
      if (lessonsError) throw lessonsError;
      
      // Get lesson IDs that already have tasks
      const { data: existingTasks, error: tasksError } = await supabase
        .from('lesson_tasks')
        .select('lesson_id');
      
      if (tasksError) throw tasksError;
      
      const tasksLessonIds = new Set(existingTasks?.map(t => t.lesson_id) || []);
      
      // Filter out lessons that already have tasks
      return (allLessons || []).filter(lesson => !tasksLessonIds.has(lesson.id));
    },
    enabled: open,
  });
  
  const filteredLessons = useMemo(() => {
    if (!lessonsSearch) return lessons;
    const query = lessonsSearch.toLowerCase();
    return lessons.filter((lesson: any) => 
      lesson.title?.toLowerCase().includes(query) ||
      lesson.chapters?.title?.toLowerCase().includes(query) ||
      lesson.chapters?.modules?.title?.toLowerCase().includes(query)
    );
  }, [lessons, lessonsSearch]);
  
  const handleSave = async () => {
    if (!selectedLesson || !instructions.trim()) {
      toast.error('יש לבחור שיעור ולהזין הוראות');
      return;
    }
    
    if (allowedTypes.length === 0) {
      toast.error('יש לבחור לפחות סוג הגשה אחד');
      return;
    }
    
    await createTask.mutateAsync({
      lesson_id: selectedLesson,
      instructions,
      allowed_types: allowedTypes,
      is_mandatory: isMandatory,
      is_active: isActive,
    });
    
    toast.success('המשימה נוצרה בהצלחה');
    
    // Reset form
    setSelectedLesson('');
    setInstructions('');
    setAllowedTypes(['text']);
    setIsMandatory(false);
    setIsActive(true);
    setLessonsSearch('');
    
    onOpenChange(false);
  };
  
  const toggleType = (type: string) => {
    setAllowedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleMandatoryChange = (checked: boolean) => {
    setIsMandatory((prev) => (prev === checked ? prev : checked));
  };

  const handleActiveChange = (checked: boolean) => {
    setIsActive((prev) => (prev === checked ? prev : checked));
  };
  
  const selectedLessonData = lessons.find((l: any) => l.id === selectedLesson) as any;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>הוספת משימה חדשה</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Lesson selector */}
          <div className="space-y-2">
            <Label>בחר שיעור</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={lessonsSearch}
                onChange={(e) => setLessonsSearch(e.target.value)}
                placeholder="חיפוש שיעור..."
                className="pr-10"
              />
            </div>
            
            {selectedLessonData && (
              <div className="p-2 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                <span className="font-medium">{selectedLessonData.title}</span>
                <span className="text-muted-foreground"> • </span>
                <span className="text-muted-foreground">
                  {selectedLessonData.chapters?.modules?.title} / {selectedLessonData.chapters?.title}
                </span>
              </div>
            )}
            
            <ScrollArea className="h-48 border rounded-lg">
              {lessonsLoading ? (
                <div className="p-4 text-center text-muted-foreground">טוען שיעורים...</div>
              ) : filteredLessons.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {lessonsSearch ? 'לא נמצאו שיעורים' : 'כל השיעורים כבר כוללים משימות'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredLessons.map((lesson: any) => (
                    <div
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson.id)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedLesson === lesson.id 
                          ? 'bg-primary/20 border border-primary/40' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium text-sm">{lesson.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {lesson.chapters?.modules?.title} / {lesson.chapters?.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="space-y-2">
            <Label>הוראות המשימה</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="הוראות המשימה..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>סוגי הגשה מותרים</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowedTypes.includes('text')}
                  onCheckedChange={() => toggleType('text')}
                />
                <span>טקסט</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowedTypes.includes('file')}
                  onCheckedChange={() => toggleType('file')}
                />
                <span>קובץ</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowedTypes.includes('image')}
                  onCheckedChange={() => toggleType('image')}
                />
                <span>תמונה</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label>משימת חובה (חוסמת התקדמות)</Label>
            <Switch checked={isMandatory} onCheckedChange={handleMandatoryChange} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>משימה פעילה</Label>
            <Switch checked={isActive} onCheckedChange={handleActiveChange} />
          </div>
          
          {isMandatory && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline ml-2 text-orange-500" />
              שיעור זה כולל משימה חובה שחוסמת התקדמות. התלמידים לא יוכלו להמשיך לשיעור הבא עד שהמשימה תאושר.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={createTask.isPending || !selectedLesson}>
            {createTask.isPending ? 'יוצר...' : 'צור משימה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SubmissionsDialogProps {
  task: TaskWithLesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubmissionsDialog = ({ task, open, onOpenChange }: SubmissionsDialogProps) => {
  const { data: submissions = [], isLoading } = useTaskSubmissions(task?.id || '');
  const { user } = useAuth();
  const overrideSubmission = useOverrideSubmission();
  
  const handleApprove = async (submissionId: string) => {
    if (!user?.id) return;
    await overrideSubmission.mutateAsync({
      submissionId,
      status: 'approved',
      adminId: user.id,
    });
    toast.success('ההגשה אושרה');
  };
  
  const handleReject = async (submissionId: string) => {
    if (!user?.id) return;
    await overrideSubmission.mutateAsync({
      submissionId,
      status: 'rejected',
      adminId: user.id,
    });
    toast.success('ההגשה נדחתה');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">אושר</Badge>;
      case 'rejected':
        return <Badge variant="destructive">נדחה</Badge>;
      case 'pending':
        return <Badge variant="secondary">ממתין</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>הגשות למשימה</DialogTitle>
          {task && (
            <p className="text-sm text-muted-foreground">
              שיעור: {task.lessons.title}
            </p>
          )}
        </DialogHeader>
        
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>אין הגשות למשימה זו עדיין</p>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {submissions.map(submission => {
                const effectiveStatus = getEffectiveStatus(submission);
                
                return (
                  <Card key={submission.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium">{submission.user_email}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(submission.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(effectiveStatus)}
                          
                          {submission.manual_override && (
                            <Badge variant="outline" className="text-xs">
                              עדכון ידני
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs mb-2">
                          {submission.submission_type === 'text' ? 'טקסט' : 
                           submission.submission_type === 'file' ? 'קובץ' : 'תמונה'}
                        </Badge>
                        
                        {submission.content_text && (
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">
                            {submission.content_text}
                          </p>
                        )}
                        
                        {submission.content_url && (
                          <a 
                            href={submission.content_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            צפה בקובץ
                          </a>
                        )}
                      </div>
                      
                      {submission.ai_explanation && (
                        <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded">
                          <span className="font-medium">הערת AI: </span>
                          {submission.ai_explanation}
                          {submission.ai_confidence && (
                            <span className="mr-2">
                              (ביטחון: {Math.round(submission.ai_confidence * 100)}%)
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={effectiveStatus === 'approved' ? 'default' : 'outline'}
                          className="gap-1"
                          onClick={() => handleApprove(submission.id)}
                          disabled={overrideSubmission.isPending}
                        >
                          <Check className="w-3 h-3" />
                          אשר
                        </Button>
                        <Button 
                          size="sm" 
                          variant={effectiveStatus === 'rejected' ? 'destructive' : 'outline'}
                          className="gap-1"
                          onClick={() => handleReject(submission.id)}
                          disabled={overrideSubmission.isPending}
                        >
                          <X className="w-3 h-3" />
                          דחה
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TasksPage;
