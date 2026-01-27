import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  AlertTriangle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  useLessonTask, 
  useUserTaskSubmission, 
  useSubmitTask,
  getEffectiveStatus,
  LessonTask
} from '@/hooks/useTasksData';
import { useAuth } from '@/hooks/useAuth';

interface TaskSubmissionSectionProps {
  lessonId: string;
}

const TaskSubmissionSection = ({ lessonId }: TaskSubmissionSectionProps) => {
  const { user, isAuthenticated } = useAuth();
  const { data: task, isLoading: taskLoading } = useLessonTask(lessonId);
  const { data: submission, isLoading: submissionLoading } = useUserTaskSubmission(task?.id || '');
  const submitTask = useSubmitTask();

  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);

  // Check if status is rejected and show dialog
  const effectiveStatus = getEffectiveStatus(submission);
  
  // Auto-show rejection dialog when status changes to rejected
  useEffect(() => {
    if (effectiveStatus === 'rejected' && submission) {
      setShowRejectedDialog(true);
    }
  }, [effectiveStatus, submission]);
  
  if (taskLoading || submissionLoading) {
    return null; // Don't show loading state, just hide until ready
  }

  if (!task || !task.is_active) {
    return null; // No task for this lesson
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400">
            <ClipboardCheck className="w-5 h-5" />
            <span>יש להתחבר כדי לצפות ולהגיש את המשימה</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
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

    // Validate submission
    const hasText = textContent.trim().length > 0;
    const hasFile = selectedFile !== null;

    if (!hasText && !hasFile) {
      toast.error('יש להזין תוכן או לצרף קובץ');
      return;
    }

    try {
      setIsUploading(true);

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

  // Show status for existing submission
  const renderStatus = () => {
    if (!submission) return null;

    const status = effectiveStatus;

    if (status === 'pending') {
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

    if (status === 'approved') {
      return (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-300">אושר!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            המשימה אושרה בהצלחה. כל הכבוד! אתה יכול להמשיך לשיעור הבא.
          </AlertDescription>
        </Alert>
      );
    }

    if (status === 'rejected') {
      return (
        <>
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <XCircle className="w-4 h-4 text-red-600" />
            <AlertTitle className="text-red-800 dark:text-red-300">נדחה</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">
              המשימה לא אושרה. אנא קרא את ההוראות שוב ונסה שנית.
            </AlertDescription>
          </Alert>
          
          <Dialog open={showRejectedDialog} onOpenChange={setShowRejectedDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  <DialogTitle>המשימה נדחתה</DialogTitle>
                </div>
                <DialogDescription className="text-right pt-4">
                  המערכת זיהתה ניסיון לעקוף את דרישות המשימה. ההגשות נבדקות באמצעות בינה מלאכותית.
                  <br /><br />
                  אנא קרא שוב את הוראות המשימה והגש הגשה חדשה התואמת את הדרישות.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={() => setShowRejectedDialog(false)}>
                הבנתי
              </Button>
            </DialogContent>
          </Dialog>
        </>
      );
    }

    return null;
  };

  const canSubmitNew = !submission || effectiveStatus === 'rejected';

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">משימת השיעור</CardTitle>
          </div>
          {task.is_mandatory && (
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              משימת חובה
            </Badge>
          )}
        </div>
        <CardDescription>
          {task.is_mandatory 
            ? 'יש להשלים משימה זו לפני המעבר לשיעור הבא'
            : 'משימה אופציונלית - לא חובה להשלים'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Instructions */}
        <div className="p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-orange-100">
          <Label className="text-sm font-medium text-orange-800 dark:text-orange-300">
            הוראות המשימה:
          </Label>
          <p className="mt-2 text-foreground whitespace-pre-wrap">
            {task.instructions}
          </p>
        </div>

        {/* Submission Status */}
        {renderStatus()}

        {/* Submission Form */}
        {canSubmitNew && (
          <div className="space-y-4 pt-2">
            {/* Text Input */}
            {task.allowed_types.includes('text') && (
              <div className="space-y-2">
                <Label>תשובה בטקסט:</Label>
                <Textarea
                  placeholder="כתוב את התשובה שלך כאן..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[120px] bg-white dark:bg-gray-900"
                  dir="rtl"
                />
              </div>
            )}

            {/* File Upload */}
            {(task.allowed_types.includes('file') || task.allowed_types.includes('image')) && (
              <div className="space-y-2">
                <Label>העלאת קובץ:</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="task-file"
                    className="hidden"
                    accept={task.allowed_types.includes('image') ? 'image/*' : '*/*'}
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="task-file"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-orange-300 bg-white/50 cursor-pointer hover:bg-orange-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">בחר קובץ</span>
                  </label>
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm">
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span>{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskSubmissionSection;
