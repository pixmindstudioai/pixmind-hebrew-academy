import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Bot,
  User,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  useAllTaskSubmissions, 
  useAdminOverrideSubmission,
  getEffectiveSubmissionStatus,
  getStatusDisplayInfo,
  TaskSubmissionWithDetails 
} from '@/hooks/useAdminTaskReview';

const TaskReviewPage = () => {
  const { data: submissions, isLoading } = useAllTaskSubmissions();
  const overrideSubmission = useAdminOverrideSubmission();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionWithDetails | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'approved' | 'rejected' | null>(null);

  // Filter submissions
  const filteredSubmissions = submissions?.filter(submission => {
    const effectiveStatus = getEffectiveSubmissionStatus(submission);
    
    // Status filter
    if (statusFilter !== 'all' && effectiveStatus !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = submission.users?.full_name?.toLowerCase() || '';
      const userEmail = submission.user_email.toLowerCase();
      const courseName = submission.lesson_tasks?.lessons?.chapters?.modules?.title?.toLowerCase() || '';
      const lessonName = submission.lesson_tasks?.lessons?.title?.toLowerCase() || '';
      
      return userName.includes(searchLower) || 
             userEmail.includes(searchLower) || 
             courseName.includes(searchLower) ||
             lessonName.includes(searchLower);
    }
    
    return true;
  }) || [];

  const handleOpenOverrideDialog = (submission: TaskSubmissionWithDetails, action: 'approved' | 'rejected') => {
    setSelectedSubmission(submission);
    setOverrideAction(action);
    setAdminNotes('');
    setIsOverrideDialogOpen(true);
  };

  const handleConfirmOverride = async () => {
    if (!selectedSubmission || !overrideAction) return;

    const effectiveStatus = getEffectiveSubmissionStatus(selectedSubmission);
    
    try {
      await overrideSubmission.mutateAsync({
        submissionId: selectedSubmission.id,
        newStatus: overrideAction,
        previousStatus: effectiveStatus,
        adminNotes: adminNotes || undefined,
      });
      
      toast.success(overrideAction === 'approved' ? 'המשימה אושרה בהצלחה' : 'המשימה נדחתה');
      setIsOverrideDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      toast.error('שגיאה בעדכון הסטטוס');
      console.error(error);
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const renderSubmissionContent = (submission: TaskSubmissionWithDetails) => {
    if (submission.content_text) {
      return (
        <div className="max-h-32 overflow-y-auto text-sm bg-muted/50 p-2 rounded">
          {submission.content_text}
        </div>
      );
    }
    if (submission.content_url) {
      if (submission.submission_type === 'image') {
        return (
          <a href={submission.content_url} target="_blank" rel="noopener noreferrer">
            <img 
              src={submission.content_url} 
              alt="הגשה" 
              className="max-h-24 max-w-full h-auto rounded border cursor-pointer hover:opacity-80"
            />
          </a>
        );
      }
      return (
        <a 
          href={submission.content_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          צפייה בקובץ
        </a>
      );
    }
    return <span className="text-muted-foreground">אין תוכן</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            בדיקת ביצועי משימות
          </h1>
          <p className="text-muted-foreground mt-1">
            סקירה ואישור ידני של כל הגשות המשימות
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto text-lg px-4 py-2">
          {submissions?.length || 0} הגשות
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="חיפוש לפי שם, אימייל, קורס או שיעור..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="סינון לפי סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="pending">ממתין לבדיקה</SelectItem>
                  <SelectItem value="approved">אושר</SelectItem>
                  <SelectItem value="rejected">נדחה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-2xl font-bold">
                  {submissions?.filter(s => getEffectiveSubmissionStatus(s) === 'pending').length || 0}
                </p>
                <p className="text-xs text-muted-foreground">ממתינים לבדיקה</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-2xl font-bold">
                  {submissions?.filter(s => getEffectiveSubmissionStatus(s) === 'approved').length || 0}
                </p>
                <p className="text-xs text-muted-foreground">אושרו</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">
                  {submissions?.filter(s => getEffectiveSubmissionStatus(s) === 'rejected').length || 0}
                </p>
                <p className="text-xs text-muted-foreground">נדחו</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {submissions?.filter(s => s.manual_override).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">דריסה ידנית</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>הגשות משימות</CardTitle>
          <CardDescription>
            רשימת כל ההגשות עם אפשרות לאישור או דחייה ידנית
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              לא נמצאו הגשות
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>משתמש</TableHead>
                    <TableHead>קורס / שיעור</TableHead>
                    <TableHead>סוג הגשה</TableHead>
                    <TableHead>תוכן</TableHead>
                    <TableHead>תאריך</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => {
                    const effectiveStatus = getEffectiveSubmissionStatus(submission);
                    const statusInfo = getStatusDisplayInfo(effectiveStatus);
                    
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {submission.users?.full_name || 'לא ידוע'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {submission.user_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {submission.lesson_tasks?.lessons?.chapters?.modules?.title || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {submission.lesson_tasks?.lessons?.title || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getSubmissionTypeIcon(submission.submission_type)}
                            <span className="text-xs">
                              {submission.submission_type === 'text' ? 'טקסט' : 
                               submission.submission_type === 'image' ? 'תמונה' : 'קובץ'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {renderSubmissionContent(submission)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(submission.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              <Badge variant={submission.ai_status === 'approved' ? 'default' : 
                                             submission.ai_status === 'rejected' ? 'destructive' : 'secondary'}>
                                {submission.ai_status === 'approved' ? 'אושר' : 
                                 submission.ai_status === 'rejected' ? 'נדחה' : 'ממתין'}
                              </Badge>
                            </div>
                            {submission.ai_confidence !== null && (
                              <p className="text-xs text-muted-foreground">
                                ביטחון: {Math.round(submission.ai_confidence)}%
                              </p>
                            )}
                            {submission.ai_explanation && (
                              <p className="text-xs text-muted-foreground max-w-[150px] truncate" title={submission.ai_explanation}>
                                {submission.ai_explanation}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(effectiveStatus)}
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                            {submission.manual_override && (
                              <Badge variant="outline" className="text-xs">
                                דריסה ידנית
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenOverrideDialog(submission, 'approved')}
                              disabled={effectiveStatus === 'approved'}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenOverrideDialog(submission, 'rejected')}
                              disabled={effectiveStatus === 'rejected'}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission && !isOverrideDialogOpen} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              פרטי הגשה
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">משתמש</p>
                  <p className="font-medium">{selectedSubmission.users?.full_name || 'לא ידוע'}</p>
                  <p className="text-sm">{selectedSubmission.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">תאריך הגשה</p>
                  <p className="font-medium">
                    {format(new Date(selectedSubmission.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">קורס</p>
                <p className="font-medium">{selectedSubmission.lesson_tasks?.lessons?.chapters?.modules?.title}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">שיעור</p>
                <p className="font-medium">{selectedSubmission.lesson_tasks?.lessons?.title}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">הוראות המשימה</p>
                <p className="bg-muted/50 p-2 sm:p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedSubmission.lesson_tasks?.instructions}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">תוכן ההגשה</p>
                <div className="bg-muted/50 p-2 sm:p-3 rounded">
                  {renderSubmissionContent(selectedSubmission)}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">תוצאות AI</p>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant={selectedSubmission.ai_status === 'approved' ? 'default' : 
                                 selectedSubmission.ai_status === 'rejected' ? 'destructive' : 'secondary'}>
                    {selectedSubmission.ai_status === 'approved' ? 'אושר' : 
                     selectedSubmission.ai_status === 'rejected' ? 'נדחה' : 'ממתין'}
                  </Badge>
                  {selectedSubmission.ai_confidence !== null && (
                    <span className="text-sm">
                      ביטחון: {Math.round(selectedSubmission.ai_confidence)}%
                    </span>
                  )}
                </div>
                {selectedSubmission.ai_explanation && (
                  <p className="mt-2 text-sm bg-muted/30 p-2 rounded">
                    {selectedSubmission.ai_explanation}
                  </p>
                )}
              </div>
              
              {selectedSubmission.manual_override && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">דריסה ידנית</span>
                  </div>
                  <p className="text-sm mt-1">
                    סטטוס ידני: {selectedSubmission.manual_status === 'approved' ? 'אושר' : 'נדחה'}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
              סגור
            </Button>
            {selectedSubmission && getEffectiveSubmissionStatus(selectedSubmission) !== 'approved' && (
              <Button onClick={() => handleOpenOverrideDialog(selectedSubmission, 'approved')}>
                <CheckCircle className="w-4 h-4 ml-2" />
                אשר
              </Button>
            )}
            {selectedSubmission && getEffectiveSubmissionStatus(selectedSubmission) !== 'rejected' && (
              <Button variant="destructive" onClick={() => handleOpenOverrideDialog(selectedSubmission, 'rejected')}>
                <XCircle className="w-4 h-4 ml-2" />
                דחה
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Confirmation Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {overrideAction === 'approved' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {overrideAction === 'approved' ? 'אישור משימה' : 'דחיית משימה'}
            </DialogTitle>
            <DialogDescription>
              {overrideAction === 'approved' 
                ? 'פעולה זו תאשר את המשימה ותפתח את הגישה לשיעור למשתמש.'
                : 'פעולה זו תדחה את המשימה והמשתמש יצטרך להגיש שוב.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">הערות מנהל (אופציונלי)</p>
              <Textarea
                placeholder="הוסף הערות לתיעוד..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOverrideDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              variant={overrideAction === 'approved' ? 'default' : 'destructive'}
              onClick={handleConfirmOverride}
              disabled={overrideSubmission.isPending}
            >
              {overrideSubmission.isPending ? 'מעדכן...' : (overrideAction === 'approved' ? 'אשר' : 'דחה')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskReviewPage;
