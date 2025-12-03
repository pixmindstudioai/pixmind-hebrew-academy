import { useState } from 'react';
import { Plus, Trash2, User, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { 
  useCohortStudents, 
  useAddCohortStudents, 
  useRemoveCohortStudent,
  CohortStudent 
} from '@/hooks/useCohortsData';

interface CohortStudentsPanelProps {
  cohortId: string;
  moduleId: string;
}

const CohortStudentsPanel = ({ cohortId, moduleId }: CohortStudentsPanelProps) => {
  const { data: students = [], isLoading } = useCohortStudents(cohortId);
  const addStudents = useAddCohortStudents();
  const removeStudent = useRemoveCohortStudent();
  
  const [emailsInput, setEmailsInput] = useState('');
  const [studentToRemove, setStudentToRemove] = useState<CohortStudent | null>(null);
  
  const handleAddStudents = () => {
    if (!emailsInput.trim()) return;
    
    // Parse emails - split by comma, newline, semicolon, or space
    const emails = emailsInput
      .split(/[,\n;]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emails.length === 0) return;
    
    addStudents.mutate({ cohortId, moduleId, emails }, {
      onSuccess: () => {
        setEmailsInput('');
      }
    });
  };
  
  const handleRemoveStudent = () => {
    if (!studentToRemove) return;
    
    removeStudent.mutate({ 
      studentId: studentToRemove.id, 
      cohortId, 
      moduleId 
    }, {
      onSuccess: () => {
        setStudentToRemove(null);
      }
    });
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'invited':
        return 'בהזמנה';
      case 'pending_user':
        return 'ממתין להרשמה';
      default:
        return status;
    }
  };
  
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'invited':
        return 'secondary';
      case 'pending_user':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Add Students Section */}
      <div className="space-y-3">
        <h4 className="font-medium">הוספת תלמידים</h4>
        <Textarea
          value={emailsInput}
          onChange={(e) => setEmailsInput(e.target.value)}
          placeholder="הכנס כתובות מייל, מופרדות בפסיקים או בשורות נפרדות..."
          rows={4}
          dir="ltr"
          className="text-left"
        />
        <p className="text-sm text-muted-foreground">
          הוסיפו תלמידים לפי מייל. ניתן להדביק כמה מיילים, מופרדים בפסיקים או בשורות נפרדות.
        </p>
        <Button 
          onClick={handleAddStudents} 
          disabled={addStudents.isPending || !emailsInput.trim()}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {addStudents.isPending ? 'מוסיף...' : 'הוספת תלמידים למחזור'}
        </Button>
      </div>
      
      {/* Students List Section */}
      <div className="space-y-3">
        <h4 className="font-medium">תלמידים במחזור ({students.length})</h4>
        
        {isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            טוען תלמידים...
          </div>
        )}
        
        {!isLoading && students.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                אין תלמידים במחזור זה עדיין
              </p>
            </CardContent>
          </Card>
        )}
        
        {!isLoading && students.length > 0 && (
          <div className="space-y-2">
            {students.map((student) => (
              <div 
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm" dir="ltr">{student.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusVariant(student.status)}>
                        {getStatusLabel(student.status)}
                      </Badge>
                      {student.user_id ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          משתמש קיים
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          עדיין ללא משתמש
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStudentToRemove(student)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="mr-1 hidden sm:inline">הסרה</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Remove Student Confirmation Dialog */}
      <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>הסרת תלמיד מהמחזור</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתם בטוחים שברצונכם להסיר את {studentToRemove?.email} מהמחזור?
              <br />
              <span className="text-muted-foreground text-xs">
                הערה: הגישה לקורס לא תבוטל אוטומטית.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              הסרה מהמחזור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CohortStudentsPanel;
