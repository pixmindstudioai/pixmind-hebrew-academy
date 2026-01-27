import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ClipboardCheck, 
  FileText, 
  ImageIcon, 
  Upload, 
  Trash2, 
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useLessonTask, 
  useUpsertLessonTask, 
  useDeleteLessonTask,
  useTaskSubmissions,
  useOverrideSubmission,
  getEffectiveStatus,
  TaskSubmission
} from '@/hooks/useTasksData';
import { useAuth } from '@/hooks/useAuth';

interface LessonTaskManagerProps {
  lessonId: string;
  disabled?: boolean;
}

const SUBMISSION_TYPES = [
  { value: 'text', label: 'טקסט', icon: FileText },
  { value: 'file', label: 'קובץ', icon: Upload },
  { value: 'image', label: 'תמונה', icon: ImageIcon },
];

const LessonTaskManager = ({ lessonId, disabled }: LessonTaskManagerProps) => {
  const { user } = useAuth();
  const { data: existingTask, isLoading } = useLessonTask(lessonId);
  const { data: submissions = [] } = useTaskSubmissions(existingTask?.id || '');
  const upsertTask = useUpsertLessonTask();
  const deleteTask = useDeleteLessonTask();
  const overrideSubmission = useOverrideSubmission();

  const [isEnabled, setIsEnabled] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['text']);
  const [isMandatory, setIsMandatory] = useState(true);
  const [showSubmissions, setShowSubmissions] = useState(false);

  // Guard against infinite update loops with Radix UI Switch
  const handleEnabledChange = (checked: boolean) => {
    setIsEnabled((prev) => (prev === checked ? prev : checked));
  };

  // Load existing task data
  useEffect(() => {
    if (existingTask) {
      setIsEnabled(existingTask.is_active);
      setInstructions(existingTask.instructions);
      setAllowedTypes(existingTask.allowed_types);
      setIsMandatory(existingTask.is_mandatory);
    }
  }, [existingTask]);

  const handleSave = async () => {
    if (!instructions.trim()) {
      toast.error('יש להזין הוראות למשימה');
      return;
    }

    if (allowedTypes.length === 0) {
      toast.error('יש לבחור לפחות סוג הגשה אחד');
      return;
    }

    try {
      await upsertTask.mutateAsync({
        id: existingTask?.id,
        lesson_id: lessonId,
        instructions,
        allowed_types: allowedTypes,
        is_mandatory: isMandatory,
        is_active: isEnabled,
      });
      toast.success('המשימה נשמרה בהצלחה');
    } catch (error) {
      toast.error('שגיאה בשמירת המשימה');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!existingTask) return;

    try {
      await deleteTask.mutateAsync({ taskId: existingTask.id, lessonId });
      setIsEnabled(false);
      setInstructions('');
      setAllowedTypes(['text']);
      setIsMandatory(true);
      toast.success('המשימה נמחקה');
    } catch (error) {
      toast.error('שגיאה במחיקת המשימה');
      console.error(error);
    }
  };

  const handleTypeToggle = (type: string) => {
    setAllowedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleOverride = async (submission: TaskSubmission, status: 'approved' | 'rejected') => {
    if (!user?.id) return;

    try {
      await overrideSubmission.mutateAsync({
        submissionId: submission.id,
        status,
        adminId: user.id,
      });
      toast.success(status === 'approved' ? 'ההגשה אושרה' : 'ההגשה נדחתה');
    } catch (error) {
      toast.error('שגיאה בעדכון הסטטוס');
      console.error(error);
    }
  };

  const getStatusBadge = (submission: TaskSubmission) => {
    const status = getEffectiveStatus(submission);
    const isOverridden = submission.manual_override;

    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 ml-1" />
            אושר {isOverridden && '(ידני)'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            נדחה {isOverridden && '(ידני)'}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 ml-1" />
            ממתין לבדיקה
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200/50 bg-orange-50/30 dark:bg-orange-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">משימה לשיעור</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="task-enabled" className="text-sm">
              {isEnabled ? 'פעילה' : 'לא פעילה'}
            </Label>
            <Switch
              id="task-enabled"
              checked={isEnabled}
              onCheckedChange={handleEnabledChange}
              disabled={disabled}
            />
          </div>
        </div>
        <CardDescription>
          הגדר משימה שהתלמידים צריכים להשלים לפני המעבר לשיעור הבא
        </CardDescription>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="space-y-2">
            <Label>הוראות המשימה *</Label>
            <Textarea
              placeholder="תאר את המשימה שעל התלמיד לבצע..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={disabled}
              className="min-h-[120px]"
              dir="rtl"
            />
          </div>

          {/* Allowed Types */}
          <div className="space-y-2">
            <Label>סוגי הגשה מותרים</Label>
            <div className="flex flex-wrap gap-3">
              {SUBMISSION_TYPES.map(type => (
                <div
                  key={type.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    allowedTypes.includes(type.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => !disabled && handleTypeToggle(type.value)}
                >
                  <Checkbox
                    checked={allowedTypes.includes(type.value)}
                    disabled={disabled}
                  />
                  <type.icon className="w-4 h-4" />
                  <span className="text-sm">{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Toggle */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="mandatory"
              checked={isMandatory}
              onCheckedChange={(checked) => setIsMandatory(!!checked)}
              disabled={disabled}
            />
            <div>
              <Label htmlFor="mandatory" className="cursor-pointer">
                משימה חובה
              </Label>
              <p className="text-xs text-muted-foreground">
                אם מסומן, התלמיד לא יוכל להמשיך לשיעור הבא ללא אישור המשימה
              </p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={disabled || upsertTask.isPending}
              >
                {upsertTask.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור משימה
              </Button>
              
              {existingTask && (
                <Dialog open={showSubmissions} onOpenChange={setShowSubmissions}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="w-4 h-4 ml-2" />
                      צפה בהגשות ({submissions.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>הגשות משימה</DialogTitle>
                      <DialogDescription>
                        רשימת כל ההגשות למשימה זו
                      </DialogDescription>
                    </DialogHeader>
                    
                    {submissions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        אין הגשות עדיין
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">תלמיד</TableHead>
                            <TableHead className="text-right">סוג</TableHead>
                            <TableHead className="text-right">תאריך</TableHead>
                            <TableHead className="text-right">סטטוס</TableHead>
                            <TableHead className="text-right">ביטחון AI</TableHead>
                            <TableHead className="text-right">פעולות</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell>{sub.user_email}</TableCell>
                              <TableCell>
                                {sub.submission_type === 'text' && 'טקסט'}
                                {sub.submission_type === 'file' && 'קובץ'}
                                {sub.submission_type === 'image' && 'תמונה'}
                              </TableCell>
                              <TableCell>
                                {new Date(sub.created_at).toLocaleDateString('he-IL')}
                              </TableCell>
                              <TableCell>{getStatusBadge(sub)}</TableCell>
                              <TableCell>
                                {sub.ai_confidence !== null 
                                  ? `${Math.round(sub.ai_confidence * 100)}%`
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>תוכן ההגשה</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        {sub.content_text && (
                                          <div>
                                            <Label>טקסט:</Label>
                                            <p className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                                              {sub.content_text}
                                            </p>
                                          </div>
                                        )}
                                        {sub.content_url && (
                                          <div>
                                            <Label>קובץ:</Label>
                                            <a 
                                              href={sub.content_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-primary hover:underline block mt-1"
                                            >
                                              צפה בקובץ
                                            </a>
                                          </div>
                                        )}
                                        {sub.ai_explanation && (
                                          <div>
                                            <Label>הסבר AI (פנימי):</Label>
                                            <p className="mt-1 p-3 bg-muted rounded-lg text-sm">
                                              {sub.ai_explanation}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                    onClick={() => handleOverride(sub, 'approved')}
                                    disabled={overrideSubmission.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={() => handleOverride(sub, 'rejected')}
                                    disabled={overrideSubmission.isPending}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {existingTask && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={disabled || deleteTask.isPending}
              >
                <Trash2 className="w-4 h-4 ml-1" />
                מחק משימה
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LessonTaskManager;
