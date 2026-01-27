import { useState } from 'react';
import { useUserGroups, useGroupPosts, usePostComments, useCreatePost, useCreateComment, DiscussionGroup, GroupPost } from '@/hooks/useDiscussionsData';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Users, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Send,
  Pin,
  Lock,
  Globe,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import AdminPostActions from '@/components/community/AdminPostActions';

const Community = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useUserGroups();
  const [selectedGroup, setSelectedGroup] = useState<DiscussionGroup | null>(null);
  const [selectedPost, setSelectedPost] = useState<GroupPost | null>(null);
  
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
  
  // Show post view
  if (selectedPost && selectedGroup) {
    return (
      <PostView
        post={selectedPost}
        group={selectedGroup}
        onBack={() => setSelectedPost(null)}
      />
    );
  }
  
  // Show group posts
  if (selectedGroup) {
    return (
      <GroupPostsView
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onSelectPost={setSelectedPost}
      />
    );
  }
  
  // Show groups list
  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">קהילה</h1>
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
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{group.title}</CardTitle>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
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
              </CardHeader>
              {group.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface GroupPostsViewProps {
  group: DiscussionGroup;
  onBack: () => void;
  onSelectPost: (post: GroupPost) => void;
}

const GroupPostsView = ({ group, onBack, onSelectPost }: GroupPostsViewProps) => {
  const { data: posts, isLoading } = useGroupPosts(group.id);
  const createPost = useCreatePost();
  const { data: adminData } = useAdminRole();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPost.mutateAsync({
      groupId: group.id,
      title: newPost.title,
      content: newPost.content,
    });
    setNewPost({ title: '', content: '' });
    setIsCreateOpen(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה לקבוצות
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{group.title}</h1>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
          
          {group.allow_posting && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  פוסט חדש
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>פוסט חדש</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Input
                    placeholder="כותרת"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="תוכן הפוסט..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={5}
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={createPost.isPending}>
                      פרסם
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      ביטול
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : posts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין פוסטים עדיין</h3>
            <p className="text-muted-foreground">
              {group.allow_posting ? 'היה הראשון לפרסם פוסט!' : 'אין פוסטים בקבוצה זו'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts?.map((post) => (
            <Card 
              key={post.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelectPost(post)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.user?.profile_picture_url || undefined} />
                    <AvatarFallback>
                      {post.user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.is_pinned && (
                        <Badge variant="secondary" className="gap-1">
                          <Pin className="w-3 h-3" />
                          מוצמד
                        </Badge>
                      )}
                      {post.is_locked && (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="w-3 h-3" />
                          נעול
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{post.user?.full_name}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(post.created_at), 'dd MMM yyyy', { locale: he })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post.comments_count || 0}
                        </span>
                        {adminData?.isAdmin && (
                          <AdminPostActions post={post} groupId={group.id} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface PostViewProps {
  post: GroupPost;
  group: DiscussionGroup;
  onBack: () => void;
}

const PostView = ({ post, group, onBack }: PostViewProps) => {
  const { data: comments, isLoading } = usePostComments(post.id);
  const createComment = useCreateComment();
  const { data: adminData } = useAdminRole();
  const [newComment, setNewComment] = useState('');
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await createComment.mutateAsync({
      postId: post.id,
      content: newComment,
    });
    setNewComment('');
  };
  
  const canComment = group.allow_posting && !post.is_locked;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" dir="rtl">
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowRight className="w-4 h-4" />
        חזרה לפוסטים
      </Button>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.user?.profile_picture_url || undefined} />
              <AvatarFallback>
                {post.user?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="w-3 h-3" />
                    מוצמד
                  </Badge>
                )}
                {post.is_locked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="w-3 h-3" />
                    נעול
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>{post.user?.full_name}</span>
                <span>•</span>
                <span>
                  {format(new Date(post.created_at), 'dd MMM yyyy, HH:mm', { locale: he })}
                </span>
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          תגובות ({comments?.length || 0})
        </h2>
        
        {canComment && (
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Textarea
              placeholder="כתוב תגובה..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[80px]"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || createComment.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
        
        {post.is_locked && (
          <p className="text-muted-foreground text-sm text-center py-2">
            הדיון נעול לתגובות חדשות
          </p>
        )}
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : comments?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            אין תגובות עדיין
          </p>
        ) : (
          <div className="space-y-4">
            {comments?.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user?.profile_picture_url || undefined} />
                      <AvatarFallback>
                        {comment.user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="font-medium">{comment.user?.full_name}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm', { locale: he })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
