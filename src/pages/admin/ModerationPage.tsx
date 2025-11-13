import { useState } from 'react';
import ModerationTable from '@/components/admin/ModerationTable';
import CommentDrawer from '@/components/admin/CommentDrawer';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  useComments, 
  useUpdateCommentStatus, 
  useDeleteComment, 
  useUpdateComment,
  CommentWithDetails,
  CommentFilters 
} from '@/hooks/useCommentsData';
import { useModules } from '@/hooks/useContentData';
import { useLessons } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';

const ModerationPage = () => {
  const [selectedComment, setSelectedComment] = useState<CommentWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<CommentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const { data: modules } = useModules('all');
  const { data: lessons } = useLessons(filters.moduleId);
  const { data: comments, isLoading, refetch } = useComments({ ...filters, searchTerm });
  const updateStatus = useUpdateCommentStatus();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();

  const handleApprove = (commentId: string) => {
    updateStatus.mutate({ commentId, status: 'approved' });
  };

  const handleHide = (commentId: string) => {
    updateStatus.mutate({ commentId, status: 'hidden' });
  };

  const handleFlag = (commentId: string) => {
    updateStatus.mutate({ commentId, status: 'flagged' });
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תגובה זו לצמיתות?')) {
      deleteComment.mutate(commentId);
    }
  };

  const handleEdit = (commentId: string, content: string) => {
    updateComment.mutate({ commentId, content });
  };

  const handleView = (comment: CommentWithDetails) => {
    setSelectedComment(comment);
    setDrawerOpen(true);
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
    }));
  };

  const handleExportCSV = () => {
    if (!comments || comments.length === 0) {
      toast.error('אין תגובות לייצוא');
      return;
    }

    const csvHeaders = ['תאריך', 'משתמש', 'אימייל', 'שיעור', 'מודול', 'תוכן', 'סטטוס', 'דירוגים'];
    const csvRows = comments.map(c => [
      format(new Date(c.created_at), 'dd/MM/yyyy HH:mm'),
      c.user.full_name,
      c.user.email,
      c.lesson.title,
      c.lesson.chapter.module.title,
      `"${c.content.replace(/"/g, '""')}"`,
      c.status,
      c.upvotes
    ]);

    const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('הקובץ יוצא בהצלחה');
  };

  return (
    <AuthenticationGuard>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ניהול תגובות</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            צפייה וניהול של תגובות משתמשים בפלטפורמה
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 md:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filters.moduleId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, moduleId: value === 'all' ? undefined : value, lessonId: undefined }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל המודולים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המודולים</SelectItem>
                {modules?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.lessonId || 'all'} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, lessonId: value === 'all' ? undefined : value }))}
              disabled={!filters.moduleId}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל השיעורים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל השיעורים</SelectItem>
                {lessons?.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: (value === 'all' ? undefined : value) as any }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="pending">ממתין לאישור</SelectItem>
                <SelectItem value="approved">מאושר</SelectItem>
                <SelectItem value="hidden">מוסתר</SelectItem>
                <SelectItem value="flagged">מסומן</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-right font-normal text-sm", !dateFrom && !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dateFrom && dateTo ? `${format(dateFrom, 'dd/MM')} - ${format(dateTo, 'dd/MM')}` : 'טווח תאריכים'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-2">
                  <div className="text-sm font-medium">מתאריך:</div>
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  <div className="text-sm font-medium mt-3">עד תאריך:</div>
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                  <Button size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} variant="outline" className="w-full">נקה</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="חיפוש בתוכן התגובה, שם משתמש, או כותרת שיעור..."
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

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">טוען תגובות...</div>
        ) : (
          <ModerationTable
            comments={comments || []}
            onApprove={handleApprove}
            onHide={handleHide}
            onFlag={handleFlag}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onView={handleView}
          />
        )}

        {selectedComment && (
          <CommentDrawer
            comment={selectedComment}
            isOpen={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setSelectedComment(null);
            }}
            onApprove={handleApprove}
            onHide={handleHide}
            onFlag={handleFlag}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>
    </AuthenticationGuard>
  );
};

export default ModerationPage;
