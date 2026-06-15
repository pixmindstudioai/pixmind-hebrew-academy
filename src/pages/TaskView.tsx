import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardCheck,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  FileText,
  ImageIcon,
  Send,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import {
  useTaskById,
  useUserTaskSubmission,
  useSubmitTask,
  getEffectiveStatus,
} from '@/hooks/useTasksData';

const TaskView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { data: task, isLoading: taskLoading, error: taskError } = useTaskById(taskId!);
  const { data: submission, isLoading: submissionLoading } = useUserTaskSubmission(taskId!);
  const submitTask = useSubmitTask();

  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);
  const [hasShownDialog, setHasShownDialog] = useState(false);

  const effectiveStatus = getEffectiveStatus(submission);

  // Show dialogs based on status changes
  useEffect(() => {
    if (hasShownDialog) return;
    
    if (effectiveStatus === 'approved' && submission) {
      setShowSuccessDialog(true);
      setHasShownDialog(true);
    } else if (effectiveStatus === 'rejected' && submission) {
      setShowRejectedDialog(true);
      setHasShownDialog(true);
    }
  }, [effectiveStatus, submission, hasShownDialog]);

  // Reset dialog flag when navigating to a new task
  useEffect(() => {
    setHasShownDialog(false);
  }, [taskId]);

  const lessonId = task?.lessons?.id;
  const lessonTitle = task?.lessons?.title || 'שיעור';
  const chapterTitle = task?.lessons?.chapters?.title || '';
  const moduleTitle = task?.lessons?.chapters?.modules?.title || '';
  const moduleId = task?.lessons?.chapters?.modules?.id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('הקובץ גדול מדי. גודל מקסימלי: 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `task-submissions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!task) return;

    const hasText = textContent.trim().length > 0;
    const hasFile = selectedFile !== null;

    if (!hasText && !hasFile) {
      toast.error('יש להזין תוכן או לצרף קובץ');
      return;
    }

    try {
      setIsUploading(true);
      setHasShownDialog(false); // Reset to allow new dialogs after submission

      let contentUrl: string | undefined;
      let submissionType: 'text' | 'file' | 'image' = 'text';

      if (selectedFile) {
        contentUrl = await uploadFile(selectedFile);
        submissionType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      }

      await submitTask.mutateAsync({
        taskId: task.id,
        submissionType,
        contentText: hasText ? textContent : undefined,
        contentUrl,
      });

      toast.success('המשימה נשלחה לבדיקה');
      setTextContent('');
      setSelectedFile(null);
    } catch (error) {
      toast.error('שגיאה בשליחת המשימה');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoToLesson = () => {
    if (lessonId) {
      navigate(`/lesson/${lessonId}`);
    }
  };

  const getStatusBadge = () => {
    switch (effectiveStatus) {
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

  const renderStatusAlert = () => {
    if (!submission) return null;

    if (effectiveStatus === 'pending') {
      return (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <Clock className="w-4 h-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">נשלח לבדיקה</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            המשימה נשלחה בהצלחה ומחכה לאישור. תוכל להמשיך לשיעור הבא לאחר שהמשימה תאושר.
          </AlertDescription>
        </Alert>
      );
    }

    if (effectiveStatus === 'approved') {
      return (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-300">אושר!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            המשימה אושרה בהצלחה. כל הכבוד! אתה יכול להמשיך לשיעור.
          </AlertDescription>
        </Alert>
      );
    }

    if (effectiveStatus === 'rejected') {
      return (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <XCircle className="w-4 h-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-300">נדחה</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            המשימה לא אושרה. אנא קרא את ההוראות שוב ונסה שנית.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const canSubmitNew = !submission || effectiveStatus === 'rejected';

  // Loading state
  if (taskLoading || submissionLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen py-6 sm:py-8">
          <div className="max-w-3xl mx-auto px-4">
            <Skeleton className="h-6 w-64 mb-6 sm:mb-8" />
            <Skeleton className="h-48 w-full mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (taskError || !task) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
                <p>משימה לא נמצאה או שאין לך הרשאה לצפות בה</p>
                <Button onClick={() => navigate('/tasks')}>
                  חזרה לרשימת המשימות
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
      <div className="min-h-screen py-6 sm:py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-6 sm:mb-8">
            <Link to="/courses" className="hover:text-foreground transition-colors">
              הקורסים
            </Link>
            <ArrowLeft className="w-4 h-4" />
            {moduleId && (
              <>
                <Link
                  to={`/courses/${moduleId}`}
                  className="hover:text-foreground transition-colors"
                >
                  {moduleTitle}
                </Link>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
            {lessonId && (
              <>
                <Link
                  to={`/lesson/${lessonId}`}
                  className="hover:text-foreground transition-colors"
                >
                  {lessonTitle}
                </Link>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
            <span className="text-foreground">משימה</span>
          </div>

          {/* Task Header Card */}
          <Card className="mb-6 border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ClipboardCheck className="w-6 h-6 text-orange-600 shrink-0" />
                  <CardTitle className="text-lg sm:text-xl break-words">משימת שיעור: "{lessonTitle}"</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {task.is_mandatory && (
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      חובה
                    </Badge>
                  )}
                  {getStatusBadge()}
                </div>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                <BookOpen className="w-4 h-4" />
                {chapterTitle && <span>{chapterTitle}</span>}
                {moduleTitle && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span>{moduleTitle}</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Instructions Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">הוראות המשימה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg border">
                <p className="whitespace-pre-wrap">{task.instructions}</p>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium">סוגי הגשה מותרים: </span>
                {task.allowed_types.map((type: string, index: number) => (
                  <span key={type}>
                    {type === 'text' && 'טקסט'}
                    {type === 'file' && 'קובץ'}
                    {type === 'image' && 'תמונה'}
                    {index < task.allowed_types.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {renderStatusAlert()}

          {/* Submission Form */}
          {canSubmitNew && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">הגשת המשימה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Input */}
                {task.allowed_types.includes('text') && (
                  <div className="space-y-2">
                    <Label>תשובה בטקסט:</Label>
                    <Textarea
                      placeholder="כתוב את התשובה שלך כאן..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-[120px]"
                      dir="rtl"
                    />
                  </div>
                )}

                {/* File Upload */}
                {(task.allowed_types.includes('file') || task.allowed_types.includes('image')) && (
                  <div className="space-y-2">
                    <Label>העלאת קובץ:</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        id="task-file"
                        className="hidden"
                        accept={task.allowed_types.includes('image') ? 'image/*' : '*/*'}
                        onChange={handleFileSelect}
                      />
                      <label
                        htmlFor="task-file"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-orange-300 bg-background cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">בחר קובץ</span>
                      </label>
                      {selectedFile && (
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          {selectedFile.type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => setSelectedFile(null)}
                          >
                            ✕
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isUploading || submitTask.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  {(isUploading || submitTask.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      שלח משימה
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Back to Lesson Button */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button variant="outline" onClick={handleGoToLesson} className="gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה לשיעור
            </Button>
          </div>

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto text-center">
              <DialogHeader className="items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <DialogTitle className="text-xl text-center">המשימה אושרה!</DialogTitle>
                <DialogDescription className="text-base text-center pt-4">
                  כל הכבוד! המשימה שלך אושרה בהצלחה ותוכל להמשיך לשיעור הבא.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={handleGoToLesson} className="w-full gap-2" size="lg">
                <ArrowRight className="w-4 h-4" />
                חזרה לשיעור
              </Button>
            </DialogContent>
          </Dialog>

          {/* Rejected Dialog */}
          <Dialog open={showRejectedDialog} onOpenChange={setShowRejectedDialog}>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto text-center">
              <DialogHeader className="items-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <DialogTitle className="text-xl text-center">המשימה נדחתה</DialogTitle>
                <DialogDescription className="text-base text-center pt-4">
                  ההגשה לא עמדה בדרישות המשימה.
                  <br /><br />
                  אנא קרא את ההוראות שוב ונסה להגיש הגשה חדשה.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={() => setShowRejectedDialog(false)} className="w-full" size="lg">
                הבנתי, אגיש שוב
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
};

export default TaskView;
