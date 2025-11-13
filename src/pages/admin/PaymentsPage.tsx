import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar, 
  Trash2, 
  Eye, 
  Shield,
  AlertCircle,
  Settings,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePaymentsData, useRevokeAccess, usePaymentStats } from '@/hooks/usePaymentsData';
import { useModules } from '@/hooks/useContentData';
import { useAdminRole } from '@/hooks/useAdminRole';
import AdminElevationModal from '@/components/admin/AdminElevationModal';

const PaymentsPage = () => {
  // Date range - default to last 30 days
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
  const defaultStartDate = format(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedModule, setSelectedModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showElevationModal, setShowElevationModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  const { data: adminCheck, isLoading: isLoadingAdmin } = useAdminRole();
  const { data: modules = [], isLoading: isLoadingModules } = useModules('all');
  const { data: stats, isLoading: isLoadingStats } = usePaymentStats();
  
  const filters = useMemo(() => ({
    startDate,
    endDate,
    moduleId: selectedModule,
    searchQuery,
  }), [startDate, endDate, selectedModule, searchQuery]);

  const { data: enrollments = [], isLoading: isLoadingEnrollments } = usePaymentsData(filters);
  const revokeAccess = useRevokeAccess();

  // Show loading while checking admin status
  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // Block access for non-admins
  if (!adminCheck?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>גישה מוגבלת</CardTitle>
            <CardDescription>
              אין לך הרשאה לצפות בעמוד זה
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                עמוד זה זמין רק למנהלי מערכת
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => setShowElevationModal(true)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              הגדר כמנהל
            </Button>
          </CardContent>
        </Card>
        
        <AdminElevationModal
          open={showElevationModal}
          onOpenChange={setShowElevationModal}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const handleRevokeAccess = async (enrollmentId: string) => {
    if (confirm('האם אתה בטוח שברצונך לבטל את הגישה? פעולה זו אינה ניתנת לביטול.')) {
      await revokeAccess.mutateAsync(enrollmentId);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-8">
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
          <CreditCard className="h-6 w-6 md:h-8 md:w-8" />
          <span className="hidden sm:inline">עסקאות והרשמות ממשולם</span>
          <span className="sm:hidden">עסקאות</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          ניהול וצפייה בכל הרכישות וההרשמות שבוצעו דרך מערכת התשלומים משולם
        </p>
        
        <Alert className="mt-3 md:mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            ברוך הבא, {adminCheck.profile?.full_name || adminCheck.profile?.email}! 
            יש לך הרשאות מנהל מערכת.
          </AlertDescription>
        </Alert>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">סך הכל עסקאות</CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">מאז ההתחלה</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">30 יום אחרונים</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last30Days}</div>
              <p className="text-xs text-muted-foreground">עסקאות חדשות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">7 יום אחרונים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last7Days}</div>
              <p className="text-xs text-muted-foreground">עסקאות שבוע זה</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Section */}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Filter className="h-4 w-4 md:h-5 md:w-5" />
            סינון ותצוגה
          </CardTitle>
          <CardDescription className="text-sm">
            סנן את העסקאות לפי טווח תאריכים, קורס או חיפוש חופשי
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Date Range */}
            <div>
              <Label htmlFor="start-date" className="flex items-center gap-2 text-sm mb-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                מתאריך
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 md:h-10 text-sm md:text-base"
              />
            </div>

            <div>
              <Label htmlFor="end-date" className="flex items-center gap-2 text-sm mb-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                עד תאריך
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 md:h-10 text-sm md:text-base"
              />
            </div>

            {/* Module Selector */}
            <div>
              <Label htmlFor="module-select" className="text-sm mb-1">קורס</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger id="module-select" className="h-9 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="כל הקורסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקורסים</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                חיפוש
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="אימייל, מזהה עסקה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              מוצגות {enrollments.length} עסקאות
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(defaultStartDate);
                setEndDate(defaultEndDate);
                setSelectedModule('all');
                setSearchQuery('');
              }}
            >
              איפוס סינון
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">עסקאות והרשמות</CardTitle>
          <CardDescription className="text-sm">
            רשימת כל העסקאות שבוצעו דרך משולם
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {isLoadingEnrollments ? (
            <div className="text-center py-8 px-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">טוען עסקאות...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8 px-4">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm md:text-base text-muted-foreground">לא נמצאו עסקאות בטווח התאריכים שנבחר</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">אימייל</TableHead>
                      <TableHead className="text-sm">קורס</TableHead>
                      <TableHead className="text-sm">מזהה עסקה</TableHead>
                      <TableHead className="text-sm">ספק</TableHead>
                      <TableHead className="text-sm">תאריך הענקה</TableHead>
                      <TableHead className="text-sm">תפוגה</TableHead>
                      <TableHead className="text-left text-sm">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium text-sm">
                          {enrollment.user_email}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{enrollment.module_title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {enrollment.transaction_id || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {enrollment.provider}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(enrollment.granted_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {enrollment.expires_at ? (
                            format(new Date(enrollment.expires_at), 'dd/MM/yyyy')
                          ) : (
                            <Badge variant="outline" className="text-xs">ללא תפוגה</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 md:gap-2 justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEnrollment(enrollment)}
                                  className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                                >
                                  <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>פרטי עסקה מלאים</DialogTitle>
                                  <DialogDescription>
                                    מידע מפורט על העסקה והגישה שניתנה
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedEnrollment && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-muted-foreground">אימייל משתמש</Label>
                                      <p className="font-medium">{selectedEnrollment.user_email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">קורס</Label>
                                      <p className="font-medium">{selectedEnrollment.module_title}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">מזהה עסקה</Label>
                                      <p className="font-mono text-sm">{selectedEnrollment.transaction_id || 'לא זמין'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">ספק תשלום</Label>
                                      <p className="font-medium">{selectedEnrollment.provider}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">תאריך הענקה</Label>
                                      <p className="font-medium">
                                        {format(new Date(selectedEnrollment.granted_at), 'dd/MM/yyyy HH:mm:ss')}
                                      </p>
                                    </div>
                                    {selectedEnrollment.expires_at && (
                                      <div>
                                        <Label className="text-muted-foreground">תאריך תפוגה</Label>
                                        <p className="font-medium">
                                          {format(new Date(selectedEnrollment.expires_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </p>
                                      </div>
                                    )}
                                    {selectedEnrollment.granted_by && (
                                      <div>
                                        <Label className="text-muted-foreground">ניתן על ידי</Label>
                                        <p className="font-medium">{selectedEnrollment.granted_by}</p>
                                      </div>
                                    )}
                                    {selectedEnrollment.notes && (
                                      <div>
                                        <Label className="text-muted-foreground">הערות</Label>
                                        <p className="font-medium">{selectedEnrollment.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeAccess(enrollment.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                              disabled={revokeAccess.isPending}
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsPage;
