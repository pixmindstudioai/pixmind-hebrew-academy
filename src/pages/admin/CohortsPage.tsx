import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useModules } from '@/hooks/useAdminData';
import { 
  useCohorts, 
  useCreateCohort, 
  useUpdateCohort, 
  useDeleteCohort,
  Cohort 
} from '@/hooks/useCohortsData';
import CohortForm from '@/components/admin/CohortForm';
import CohortStudentsPanel from '@/components/admin/CohortStudentsPanel';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const CohortsPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  
  const { data: modules = [] } = useModules();
  const module = modules.find(m => m.id === moduleId);
  
  const { data: cohorts = [], isLoading } = useCohorts(moduleId || '');
  
  const createCohort = useCreateCohort();
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState<Cohort | null>(null);
  const [studentsPanelCohort, setStudentsPanelCohort] = useState<Cohort | null>(null);
  
  const handleCreate = () => {
    setEditingCohort(null);
    setDialogOpen(true);
  };
  
  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setDialogOpen(true);
  };
  
  const handleDelete = (cohort: Cohort) => {
    setCohortToDelete(cohort);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (cohortToDelete && moduleId) {
      deleteCohort.mutate({ id: cohortToDelete.id, module_id: moduleId }, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setCohortToDelete(null);
        }
      });
    }
  };
  
  const handleSubmit = (data: any) => {
    if (editingCohort) {
      updateCohort.mutate({ 
        id: editingCohort.id, 
        module_id: moduleId!,
        ...data 
      }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingCohort(null);
        }
      });
    } else {
      createCohort.mutate({ 
        module_id: moduleId!,
        ...data 
      }, {
        onSuccess: () => {
          setDialogOpen(false);
        }
      });
    }
  };
  
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return '—';
    const start = startDate ? format(new Date(startDate), 'dd/MM/yyyy', { locale: he }) : '';
    const end = endDate ? format(new Date(endDate), 'dd/MM/yyyy', { locale: he }) : '';
    if (start && end) return `${start} – ${end}`;
    if (start) return `מ-${start}`;
    if (end) return `עד ${end}`;
    return '—';
  };
  
  if (!moduleId) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-muted-foreground">מודול לא נמצא</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/content')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            ניהול מחזורים למודול: {module?.title || 'טוען...'}
          </h1>
          <p className="text-muted-foreground">
            צרו מחזורים, הוסיפו תלמידים לפי מייל, ושלבו אותם בקורס.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          יצירת מחזור חדש
        </Button>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          טוען מחזורים...
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && cohorts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">לא קיימים מחזורים למודול זה</h3>
            <p className="text-muted-foreground mb-4">
              התחילו ביצירת מחזור חדש להוספת תלמידים לקורס.
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              יצירת מחזור חדש
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Cohorts list - Desktop */}
      {!isLoading && cohorts.length > 0 && (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>רשימת מחזורים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4 font-medium">שם המחזור</th>
                        <th className="text-right py-3 px-4 font-medium">תאריכים</th>
                        <th className="text-right py-3 px-4 font-medium">סטטוס</th>
                        <th className="text-right py-3 px-4 font-medium">מספר תלמידים</th>
                        <th className="text-left py-3 px-4 font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((cohort) => (
                        <tr key={cohort.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{cohort.name}</div>
                              {cohort.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {cohort.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDateRange(cohort.start_date, cohort.end_date)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={cohort.is_active ? 'default' : 'secondary'}>
                              {cohort.is_active ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {cohort.student_count || 0}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStudentsPanelCohort(cohort)}
                              >
                                <Users className="h-4 w-4 ml-1" />
                                תלמידים
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(cohort)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(cohort)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Mobile card view */}
          <div className="md:hidden space-y-4">
            {cohorts.map((cohort) => (
              <Card key={cohort.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{cohort.name}</h3>
                      {cohort.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {cohort.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={cohort.is_active ? 'default' : 'secondary'}>
                      {cohort.is_active ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateRange(cohort.start_date, cohort.end_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {cohort.student_count || 0} תלמידים
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setStudentsPanelCohort(cohort)}
                    >
                      <Users className="h-4 w-4 ml-1" />
                      ניהול תלמידים
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cohort)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cohort)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {/* Create/Edit Cohort Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingCohort ? 'עריכת מחזור' : 'יצירת מחזור חדש'}
            </DialogTitle>
          </DialogHeader>
          <CohortForm
            cohort={editingCohort}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={createCohort.isPending || updateCohort.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מחזור</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתם בטוחים שברצונכם למחוק את המחזור "{cohortToDelete?.name}"?
              פעולה זו תמחק גם את כל התלמידים המשויכים למחזור זה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Students Panel Dialog */}
      <Dialog 
        open={!!studentsPanelCohort} 
        onOpenChange={(open) => !open && setStudentsPanelCohort(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>תלמידי מחזור: {studentsPanelCohort?.name}</DialogTitle>
          </DialogHeader>
          {studentsPanelCohort && moduleId && (
            <CohortStudentsPanel
              cohortId={studentsPanelCohort.id}
              moduleId={moduleId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CohortsPage;
