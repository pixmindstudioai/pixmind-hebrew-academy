import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useModules } from '@/hooks/useAdminData';
import { useEnrollments, useGrantAccess, useRevokeAccess } from '@/hooks/useEnrollmentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Plus, Search } from 'lucide-react';
import { EnrollmentsTable } from '@/components/admin/EnrollmentsTable';
import { GrantAccessModal } from '@/components/admin/GrantAccessModal';
import { toast } from '@/hooks/use-toast';

export default function CourseEnrollmentsPage() {
  const { data: adminData, isLoading: adminLoading } = useAdminRole();
  const isAdmin = adminData?.isAdmin || false;
  const { data: modules = [] } = useModules();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);

  const { 
    data: enrollments = [], 
    isLoading, 
    refetch 
  } = useEnrollments(selectedModuleId === 'all' ? undefined : selectedModuleId, searchQuery);

  const grantAccessMutation = useGrantAccess();
  const revokeAccessMutation = useRevokeAccess();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">
            גישה לא מורשית
          </h1>
          <p className="text-muted-foreground">
            אין לך הרשאות לצפות בעמוד זה
          </p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    refetch();
    toast({
      title: "רענון הושלם",
      description: "נתוני ההרשמות עודכנו בהצלחה"
    });
  };

  const handleExportCSV = () => {
    if (!enrollments.length) {
      toast({
        title: "אין נתונים לייצוא",
        description: "לא נמצאו הרשמות לייצוא",
        variant: "destructive"
      });
      return;
    }

    const headers = ['שם משתמש', 'אימייל', 'קורס', 'סטטוס', 'תאריך מתן גישה', 'ספק', 'מזהה עסקה', 'תפוגה'];
    const csvData = enrollments.map(enrollment => [
      enrollment.user_name || enrollment.user_email,
      enrollment.user_email,
      enrollment.module_title,
      enrollment.is_active ? 'פעיל' : 'פג תוקף',
      new Date(enrollment.granted_at).toLocaleDateString('he-IL'),
      enrollment.provider || 'ידני',
      enrollment.transaction_id || '',
      enrollment.expires_at ? new Date(enrollment.expires_at).toLocaleDateString('he-IL') : 'ללא הגבלה'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "הייצוא הושלם",
      description: `יוצאו ${enrollments.length} הרשמות בהצלחה`
    });
  };

  const handleRevokeAccess = async (enrollmentId: string) => {
    if (!confirm('בטוח למחוק את הגישה?')) return;

    try {
      await revokeAccessMutation.mutateAsync(enrollmentId);
      toast({
        title: "גישה הוסרה",
        description: "הגישה למשתמש הוסרה בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הגישה",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          ניהול הרשמות לקורסים
        </h1>
        <Button 
          onClick={() => setShowGrantModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          הוסף גישה
        </Button>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Module Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">קורס:</span>
          <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="בחר קורס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקורסים</SelectItem>
              {modules
                .filter(module => module.is_verified)
                .map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חיפוש לפי אימייל/שם"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={!enrollments.length}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            ייצא CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <EnrollmentsTable 
        enrollments={enrollments}
        isLoading={isLoading}
        onRevokeAccess={handleRevokeAccess}
        onRefresh={refetch}
      />

      {/* Grant Access Modal */}
      <GrantAccessModal 
        open={showGrantModal}
        onOpenChange={setShowGrantModal}
        modules={modules.filter(m => m.is_verified)}
        onSuccess={() => {
          refetch();
          setShowGrantModal(false);
        }}
      />
    </div>
  );
}