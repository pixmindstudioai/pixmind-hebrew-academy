import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useUserTasks, getEffectiveStatus } from '@/hooks/useTasksData';

const Tasks = () => {
  const { data: tasks = [], isLoading, error } = useUserTasks();

  // Group tasks by module
  const tasksByModule = tasks.reduce((acc, task) => {
    const moduleTitle = (task as any).lessons?.chapters?.modules?.title || 'ללא קורס';
    if (!acc[moduleTitle]) {
      acc[moduleTitle] = [];
    }
    acc[moduleTitle].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const getStatusBadge = (task: any) => {
    const status = getEffectiveStatus(task.submission);

    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 ml-1" />
            אושר
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            נדחה
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Clock className="w-3 h-3 ml-1" />
            בבדיקה
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <ClipboardCheck className="w-3 h-3 ml-1" />
            לא הוגש
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8">
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p>שגיאה בטעינת המשימות</p>
                <Button onClick={() => window.location.reload()}>
                  נסה שוב
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">המשימות שלי</h1>
            </div>
            <p className="text-muted-foreground">
              כאן תוכל לראות את כל המשימות מהקורסים שאתה רשום אליהם
            </p>
          </div>

          {/* No Tasks State */}
          {tasks.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">אין משימות עדיין</h3>
                <p className="text-muted-foreground mb-4">
                  המשימות יופיעו כאן כשתתחיל ללמוד בקורסים
                </p>
                <Button asChild>
                  <Link to="/courses">עבור לקורסים</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tasks by Module */}
          <div className="space-y-8">
            {Object.entries(tasksByModule).map(([moduleTitle, moduleTasks]) => (
              <div key={moduleTitle}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {moduleTitle}
                </h2>

                <div className="space-y-3">
                  {moduleTasks.map((task: any) => {
                    const lessonTitle = task.lessons?.title || 'שיעור לא ידוע';
                    const chapterTitle = task.lessons?.chapters?.title || '';
                    const lessonId = task.lessons?.id;
                    const submissionDate = task.submission?.created_at 
                      ? new Date(task.submission.created_at).toLocaleDateString('he-IL')
                      : null;

                    return (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{lessonTitle}</span>
                                {task.is_mandatory && (
                                  <Badge variant="outline" className="text-xs">
                                    חובה
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {chapterTitle}
                              </div>
                              {submissionDate && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  הוגש: {submissionDate}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {getStatusBadge(task)}
                              
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/tasks/${task.id}`}>
                                  עבור למשימה
                                  <ArrowLeft className="w-4 h-4 mr-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          {tasks.length > 0 && (
            <Card className="mt-8 bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-around text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => getEffectiveStatus((t as any).submission) === 'approved').length}
                    </div>
                    <div className="text-sm text-muted-foreground">אושרו</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {tasks.filter(t => getEffectiveStatus((t as any).submission) === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">בבדיקה</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {tasks.filter(t => getEffectiveStatus((t as any).submission) === 'rejected').length}
                    </div>
                    <div className="text-sm text-muted-foreground">נדחו</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {tasks.filter(t => getEffectiveStatus((t as any).submission) === 'none').length}
                    </div>
                    <div className="text-sm text-muted-foreground">לא הוגשו</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Tasks;
