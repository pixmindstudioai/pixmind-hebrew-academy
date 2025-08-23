
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Eye, 
  Check, 
  X, 
  Flag, 
  MessageSquare,
  ThumbsUp,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModerationComment } from '@/types/admin';
import { cn } from '@/lib/utils';

interface ModerationTableProps {
  comments: ModerationComment[];
  onApprove: (commentId: string) => void;
  onHide: (commentId: string) => void;
  onFlag: (commentId: string) => void;
  onView: (comment: ModerationComment) => void;
}

const ModerationTable = ({ 
  comments, 
  onApprove, 
  onHide, 
  onFlag, 
  onView 
}: ModerationTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  const getStatusBadge = (status: ModerationComment['status']) => {
    const variants = {
      pending: { label: 'ממתין', variant: 'secondary' as const },
      approved: { label: 'מאושר', variant: 'default' as const },
      hidden: { label: 'מוסתר', variant: 'destructive' as const },
      flagged: { label: 'מדווח', variant: 'outline' as const }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.includes(searchTerm) || 
                         comment.username.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelection = (commentId: string) => {
    const newSelection = new Set(selectedComments);
    if (newSelection.has(commentId)) {
      newSelection.delete(commentId);
    } else {
      newSelection.add(commentId);
    }
    setSelectedComments(newSelection);
  };

  const handleBulkAction = (action: 'approve' | 'hide' | 'flag') => {
    selectedComments.forEach(commentId => {
      switch (action) {
        case 'approve':
          onApprove(commentId);
          break;
        case 'hide':
          onHide(commentId);
          break;
        case 'flag':
          onFlag(commentId);
          break;
      }
    });
    setSelectedComments(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול תגובות</h2>
          <p className="text-muted-foreground">
            ניהול והחלטה על תגובות מדווחות ופעולות מודרציה
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש תגובות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="approved">מאושר</SelectItem>
            <SelectItem value="hidden">מוסתר</SelectItem>
            <SelectItem value="flagged">מדווח</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedComments.size > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium">
            נבחרו {selectedComments.size} תגובות
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('approve')}
            >
              <Check className="w-4 h-4 ml-2" />
              אישור הכל
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('hide')}
            >
              <X className="w-4 h-4 ml-2" />
              הסתרת הכל
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('flag')}
            >
              <Flag className="w-4 h-4 ml-2" />
              דיווח הכל
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedComments(new Set(filteredComments.map(c => c.id)));
                    } else {
                      setSelectedComments(new Set());
                    }
                  }}
                  className="rounded"
                />
              </TableHead>
              <TableHead>תוכן התגובה</TableHead>
              <TableHead>משתמש</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead>לייקים</TableHead>
              <TableHead>דיווחים</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedComments.has(comment.id)}
                    onChange={() => toggleSelection(comment.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={comment.content}>
                    {comment.content}
                  </div>
                  {comment.replies.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      {comment.replies.length} תשובות
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{comment.username}</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(comment.status)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { 
                    addSuffix: true, 
                    locale: he 
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                    <span>{comment.upvotes}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={comment.reportCount > 0 ? "destructive" : "secondary"}>
                    {comment.reportCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onView(comment)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onApprove(comment.id)}>
                          <Check className="w-4 h-4 ml-2" />
                          אישור
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHide(comment.id)}>
                          <X className="w-4 h-4 ml-2" />
                          הסתרה
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onFlag(comment.id)}>
                          <Flag className="w-4 h-4 ml-2" />
                          דיווח
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredComments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>לא נמצאו תגובות מתאימות לסינון</p>
        </div>
      )}
    </div>
  );
};

export default ModerationTable;
