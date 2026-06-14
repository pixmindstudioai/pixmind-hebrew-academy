import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponsiveTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ResponsiveTable';
import { Search, CalendarIcon, RefreshCw, Download, Eye, Ban, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useStudents, useUpdateUserStatus, StudentFilters } from '@/hooks/useStudentsData';
import { useModules } from '@/hooks/useContentData';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const StudentsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<StudentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'courses' | 'xp'>('date');

  const { data: students, isLoading, refetch } = useStudents({ ...filters, searchTerm });
  const { data: modules } = useModules('all');
  const updateStatus = useUpdateUserStatus();

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
    }));
  };

  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    const csvHeaders = ['שם מלא', 'אימייל', 'תאריך הרשמה', 'כניסה אחרונה', 'קורסים', 'שיעורים שהושלמו', 'סטטוס'];
    const csvRows = students.map(s => [
      s.full_name || '',
      s.email,
      format(new Date(s.created_at), 'dd/MM/yyyy'),
      s.last_login_at ? format(new Date(s.last_login_at), 'dd/MM/yyyy HH:mm') : 'לא התחבר',
      s.enrolled_modules.length.toString(),
      `${s.progress_summary.completed_lessons}/${s.progress_summary.total_lessons}`,
      s.status === 'active' ? 'פעיל' : 'חסום'
    ]);

    const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('הקובץ יוצא בהצלחה');
  };

  const sortedStudents = students ? [...students].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.full_name || '').localeCompare(b.full_name || '');
      case 'email':
        return a.email.localeCompare(b.email);
      case 'courses':
        return b.enrolled_modules.length - a.enrolled_modules.length;
      case 'xp':
        return (b.xp_total ?? 0) - (a.xp_total ?? 0);
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  }) : [];

  return (
    <AuthenticationGuard>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ניהול תלמידים</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            צפייה וניהול של כל התלמידים בפלטפורמה
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-3 md:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filters.moduleId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, moduleId: value === 'all' ? undefined : value }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל הקורסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקורסים</SelectItem>
                {modules?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: (value === 'all' ? undefined : value) as any }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="active">פעילים</SelectItem>
                <SelectItem value="blocked">חסומים</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="מיון לפי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">תאריך הרשמה</SelectItem>
                <SelectItem value="name">שם</SelectItem>
                <SelectItem value="email">אימייל</SelectItem>
                <SelectItem value="courses">מספר קורסים</SelectItem>
                <SelectItem value="xp">XP</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("text-sm", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM') : 'טווח תאריכים'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="p-3 space-y-2">
                  <div className="text-sm font-medium">מתאריך:</div>
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                  <div className="text-sm font-medium mt-3">עד תאריך:</div>
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                  <Button size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} variant="outline" className="w-full">נקה</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="חיפוש לפי שם, אימייל או קורס..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="text-sm"
            />
            <Button onClick={handleSearch} size="sm" className="shrink-0">
              <Search className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">חפש</span>
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="shrink-0">
              <Download className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">ייצוא</span>
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">טוען תלמידים...</div>
        ) : sortedStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">לא נמצאו תלמידים</p>
            <p className="text-sm">נסה לשנות את הסינונים או החיפוש</p>
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 md:w-16"></TableHead>
                <TableHead>פרטים</TableHead>
                <TableHead className="hidden lg:table-cell">קורסים</TableHead>
                <TableHead className="hidden md:table-cell">התקדמות</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>רמה</TableHead>
                <TableHead className="hidden lg:table-cell">רצף</TableHead>
                <TableHead className="hidden sm:table-cell">כניסה אחרונה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="text-center">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarImage src={student.profile_picture_url} />
                      <AvatarFallback>{student.full_name?.charAt(0) || student.email.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{student.full_name || 'ללא שם'}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                      <p className="text-xs text-muted-foreground">הצטרף: {format(new Date(student.created_at), 'dd/MM/yy')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      {student.enrolled_modules.length} קורסים
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs">
                      {student.progress_summary.completed_lessons}/{student.progress_summary.total_lessons} שיעורים
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-primary">{student.xp_total ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{student.level ?? 1}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    {student.current_streak ?? 0} ימים
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">
                    {student.last_login_at ? format(new Date(student.last_login_at), 'dd/MM HH:mm') : 'לא התחבר'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                      {student.status === 'active' ? 'פעיל' : 'חסום'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/students/${student.id}`)}
                        title="צפייה"
                        className="h-7 w-7 md:h-8 md:w-8 p-0"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                      {student.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus.mutate({ userId: student.id, status: 'blocked' })}
                          title="חסימה"
                          className="h-7 w-7 md:h-8 md:w-8 p-0"
                        >
                          <Ban className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus.mutate({ userId: student.id, status: 'active' })}
                          title="שחרור חסימה"
                          className="h-7 w-7 md:h-8 md:w-8 p-0"
                        >
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        )}
      </div>
    </AuthenticationGuard>
  );
};

export default StudentsPage;
