import { useState, useRef, useEffect } from 'react';
import { useUserGroups, useGroupPosts, usePostComments, useCreatePost, useCreateComment, DiscussionGroup, GroupPost, GroupComment } from '@/hooks/useDiscussionsData';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Users, 
  ChevronLeft,
  Send,
  Pin,
  Lock,
  Globe,
  ArrowRight,
  Image as ImageIcon,
  X,
  Reply,
  MoreVertical
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import AdminPostActions from '@/components/community/AdminPostActions';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Community = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useUserGroups();
  const [selectedGroup, setSelectedGroup] = useState<DiscussionGroup | null>(null);
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12" dir="rtl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">התחבר כדי לגשת לקהילה</h3>
            <p className="text-muted-foreground mb-4">
              הקהילה זמינה רק למשתמשים מחוברים
            </p>
            <Button onClick={() => navigate('/login')}>
              התחברות
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show chat view for selected group
  if (selectedGroup) {
    return (
      <GroupChatView
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }
  
  // Show groups list
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir="rtl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">קהילה</h1>
        <p className="text-muted-foreground">
          הצטרף לדיונים ושתף את הידע שלך
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין קבוצות זמינות</h3>
            <p className="text-muted-foreground">
              אין לך גישה לקבוצות דיון כרגע
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedGroup(group)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{group.title}</h3>
                      <Badge variant="outline" className="gap-1 mt-1">
                        {group.access_type === 'open' ? (
                          <>
                            <Globe className="w-3 h-3" />
                            פתוחה
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            חברים
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface GroupChatViewProps {
  group: DiscussionGroup;
  onBack: () => void;
}

const GroupChatView = ({ group, onBack }: GroupChatViewProps) => {
  const { data: posts, isLoading } = useGroupPosts(group.id);
  const createPost = useCreatePost();
  const { data: adminData } = useAdminRole();
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<GroupPost | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [posts]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await createPost.mutateAsync({
      groupId: group.id,
      title: replyingTo ? `תגובה ל: ${replyingTo.title}` : newMessage.slice(0, 50),
      content: newMessage,
    });
    
    setNewMessage('');
    setReplyingTo(null);
  };
  
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'אתמול ' + format(date, 'HH:mm');
    }
    return format(date, 'dd/MM HH:mm');
  };
  
  // Sort posts chronologically (oldest first for chat view)
  const sortedPosts = [...(posts || [])].sort((a, b) => {
    // Pinned posts stay at top
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  return (
    <div className="h-[calc(100dvh-4rem-env(safe-area-inset-top))] flex flex-col" dir="rtl">
      {/* Chat Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h2 className="font-semibold">{group.title}</h2>
          <p className="text-xs text-muted-foreground">
            {posts?.length || 0} הודעות
          </p>
        </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-20 flex-1" />
              </div>
            ))}
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {group.allow_posting ? 'אין הודעות עדיין. היה הראשון לכתוב!' : 'אין הודעות בקבוצה זו'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <ChatMessage 
                key={post.id} 
                post={post}
                group={group}
                isAdmin={adminData?.isAdmin || false}
                onReply={() => {
                  setReplyingTo(post);
                  inputRef.current?.focus();
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center gap-3">
          <Reply className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary">מגיב/ה ל {replyingTo.user?.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Input Area */}
      {group.allow_posting ? (
        <form onSubmit={handleSendMessage} className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t bg-card">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="כתוב הודעה..."
              className="flex-1"
              disabled={createPost.isPending}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || createPost.isPending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
          <Lock className="w-4 h-4 inline ml-2" />
          הקבוצה סגורה לפרסום הודעות
        </div>
      )}
    </div>
  );
};

interface ChatMessageProps {
  post: GroupPost;
  group: DiscussionGroup;
  isAdmin: boolean;
  onReply: () => void;
}

const ChatMessage = ({ post, group, isAdmin, onReply }: ChatMessageProps) => {
  const { user } = useAuth();
  const { data: comments = [] } = usePostComments(post.id);
  const createComment = useCreateComment();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const isOwnMessage = user?.id === post.user_id;
  
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    await createComment.mutateAsync({
      postId: post.id,
      content: replyText,
    });
    
    setReplyText('');
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'אתמול ' + format(date, 'HH:mm');
    }
    return format(date, 'dd/MM HH:mm');
  };
  
  return (
    <div className={cn("flex gap-2", isOwnMessage && "flex-row-reverse")}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={post.user?.profile_picture_url || undefined} />
        <AvatarFallback className="text-xs">
          {post.user?.full_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("max-w-[85%] sm:max-w-[75%] min-w-0 sm:min-w-[200px]", isOwnMessage && "items-end")}>
        {/* Message Bubble */}
        <div 
          className={cn(
            "rounded-2xl px-4 py-2 relative group",
            isOwnMessage 
              ? "bg-primary text-primary-foreground rounded-tr-none" 
              : "bg-muted rounded-tl-none"
          )}
        >
          {/* Sender Name & Badges */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-medium",
              isOwnMessage ? "text-primary-foreground/80" : "text-primary"
            )}>
              {post.user?.full_name || 'משתמש'}
            </span>
            
            {post.is_pinned && (
              <Badge variant="secondary" className="text-[10px] py-0 h-4 gap-0.5">
                <Pin className="w-2.5 h-2.5" />
                מוצמד
              </Badge>
            )}
            
            {post.is_locked && (
              <Badge variant="outline" className="text-[10px] py-0 h-4 gap-0.5">
                <Lock className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
          
          {/* Message Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
          
          {/* Time */}
          <div className={cn(
            "text-[10px] mt-1",
            isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {formatTime(post.created_at)}
          </div>
          
          {/* Actions */}
          <div className={cn(
            "absolute top-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
            isOwnMessage ? "left-1" : "right-1"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-6 sm:w-6">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onReply}>
                  <Reply className="w-4 h-4 ml-2" />
                  הגב
                </DropdownMenuItem>
                {isAdmin && (
                  <AdminPostActions post={post} groupId={group.id} asDropdownItems />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Reply Count */}
        {(post.comments_count || 0) > 0 && (
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            {post.comments_count} תגובות
          </button>
        )}
        
        {/* Replies */}
        {showReplies && (
          <div className="mt-2 mr-2 sm:mr-4 space-y-2">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={comment.user?.profile_picture_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {comment.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-sm">
                  <span className="font-medium text-xs text-primary">
                    {comment.user?.full_name}
                  </span>
                  <p className="text-sm">{comment.content}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Reply Input */}
            {group.allow_posting && !post.is_locked && (
              <form onSubmit={handleReply} className="flex gap-2 mt-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="הוסף תגובה..."
                  className="flex-1 h-10 sm:h-8 text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 sm:h-8"
                  disabled={!replyText.trim() || createComment.isPending}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
