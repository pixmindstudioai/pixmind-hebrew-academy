
import { useState, useEffect } from 'react';
import ModerationTable from '@/components/admin/ModerationTable';
import CommentDrawer from '@/components/admin/CommentDrawer';
import { ModerationComment, ModerationAction } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

// Mock data - would come from API in real implementation
const mockComments: ModerationComment[] = [
  {
    id: '1',
    lessonId: 'lesson-1',
    userId: 'user-1',
    username: 'יוסי כהן',
    content: 'השיעור היה מעולה! למדתי הרבה דברים חדשים וחשובים.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'pending',
    reportCount: 0,
    upvotes: 5,
    replies: [],
    moderationHistory: []
  },
  {
    id: '2',
    lessonId: 'lesson-2',
    userId: 'user-2',
    username: 'שרה לוי',
    content: 'יש בעיה עם הסרטון, הוא לא נטען אצלי. מישהו יכול לעזור?',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    status: 'approved',
    reportCount: 0,
    upvotes: 2,
    replies: [
      {
        id: '2-1',
        lessonId: 'lesson-2',
        userId: 'user-3',
        username: 'מיכל גרין',
        content: 'גם אצלי הייתה אותה בעיה, נסי לרענן את הדף',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        status: 'approved',
        reportCount: 0,
        upvotes: 1,
        replies: [],
        moderationHistory: []
      }
    ],
    moderationHistory: [
      {
        id: 'action-1',
        commentId: '2',
        moderatorId: 'admin-1',
        action: 'approve',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      }
    ]
  },
  {
    id: '3',
    lessonId: 'lesson-1',
    userId: 'user-4',
    username: 'דן אברמס',
    content: 'זה לא נכון מה שאמרת בשיעור! יש לי הוכחות אחרות!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    status: 'flagged',
    reportCount: 3,
    upvotes: 0,
    replies: [],
    moderationHistory: [
      {
        id: 'action-2',
        commentId: '3',
        moderatorId: 'admin-1',
        action: 'flag',
        reason: 'תוכן מעורר מחלוקת',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      }
    ]
  }
];

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
  const { toast } = useToast();

  const addModerationAction = (commentId: string, action: ModerationAction['action'], reason?: string) => {
    const newAction: ModerationAction = {
      id: `action-${Date.now()}`,
      commentId,
      moderatorId: 'current-admin',
      action,
      reason,
      timestamp: new Date(),
    };

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          moderationHistory: [...comment.moderationHistory, newAction]
        };
      }
      return comment;
    }));
  };

  const handleApprove = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, status: 'approved' as const }
        : comment
    ));
    addModerationAction(commentId, 'approve');
    toast({
      title: "התגובה אושרה",
      description: "התגובה זמינה כעת לציבור",
    });
  };

  const handleHide = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, status: 'hidden' as const }
        : comment
    ));
    addModerationAction(commentId, 'hide');
    toast({
      title: "התגובה הוסתרה",
      description: "התגובה אינה זמינה לציבור",
    });
  };

  const handleFlag = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, status: 'flagged' as const }
        : comment
    ));
    addModerationAction(commentId, 'flag');
    toast({
      title: "התגובה דווחה",
      description: "התגובה סומנה לבדיקה נוספת",
    });
  };

  const handleRestore = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, status: 'approved' as const }
        : comment
    ));
    addModerationAction(commentId, 'restore');
    toast({
      title: "התגובה שוחזרה",
      description: "התגובה זמינה שוב לציבור",
    });
  };

  const handleView = (comment: ModerationComment) => {
    setSelectedComment(comment);
    setDrawerOpen(true);
  };

  return (
    <>
      <ModerationTable
        comments={comments}
        onApprove={handleApprove}
        onHide={handleHide}
        onFlag={handleFlag}
        onView={handleView}
      />
      
      <CommentDrawer
        comment={selectedComment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApprove}
        onHide={handleHide}
        onFlag={handleFlag}
        onRestore={handleRestore}
      />
    </>
  );
};

export default ModerationPage;
