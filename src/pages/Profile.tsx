import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, BookOpen, MessageCircle, LogOut, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useModules, useUserProgress } from '@/hooks/useContentData';
import Navigation from '@/components/Navigation';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  const [error, setError] = useState('');

  const { data: modules = [], isLoading: modulesLoading } = useModules('all');
  const { data: userProgress = [], isLoading: progressLoading } = useUserProgress(user?.id);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      setUser(session.user);
      setFormData({
        fullName: session.user.user_metadata?.full_name || '',
        email: session.user.email || ''
      });

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setUserProfile(profile);

      if (session.user) {
        const { data: userComments } = await supabase
          .from('comments')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        setComments(userComments || []);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/login');
        } else {
          setUser(session.user);
        }
      }
    );

    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          setUserProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [navigate, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('users')
        .update({ full_name: formData.fullName })
        .eq('id', user.id);

      if (dbError) throw dbError;

      toast.success("פרופיל עודכן בהצלחה!");
      setIsEditing(false);
    } catch (err) {
      setError('שגיאה בעדכון הפרופיל');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpdate = (url: string | null) => {
    setUserProfile((prev: any) => ({ ...prev, profile_picture_url: url }));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("לא ניתן להתנתק. אנא נסה שוב");
    } else {
      toast.success("התנתקת בהצלחה!");
      navigate('/');
    }
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleProgressEntries = userProgress.filter(p => p.lesson_id);
    const completedLessons = moduleProgressEntries.filter(p => p.completed).length;
    const totalLessons = moduleProgressEntries.length || 1;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="section-container py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">הפרופיל שלי</h1>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 ml-2" />
                התנתק
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {user && (
                <ProfileImageUpload
                  userId={user.id}
                  currentImageUrl={userProfile?.profile_picture_url}
                  userName={formData.fullName || formData.email}
                  onImageUpdate={handleImageUpdate}
                />
              )}

              <div className="flex-1 w-full">
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName">שם מלא</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="opacity-60"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? 'שומר...' : 'שמור'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{formData.fullName || 'משתמש'}</h2>
                    <p className="text-muted-foreground mb-4">{formData.email}</p>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      ערוך פרופיל
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span>הקורסים שלי</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>הודעות</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span>הגדרות</span>
            </TabsTrigger>
          </TabsList>

          {/* My Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">הקורסים שלי</CardTitle>
              </CardHeader>
              <CardContent>
                {modules.length > 0 ? (
                  <div className="space-y-4">
                    {modules.map((module) => {
                      const progress = getModuleProgress(module.id);
                      return (
                        <div 
                          key={module.id} 
                          className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{module.title}</h4>
                            <span className="text-sm text-primary font-medium">{progress}%</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {module.description}
                          </p>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>עדיין לא נרשמת לאף קורס</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ההודעות שלי</CardTitle>
              </CardHeader>
              <CardContent>
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.slice(0, 10).map((comment) => (
                      <div 
                        key={comment.id} 
                        className="p-4 rounded-xl border border-border/50"
                      >
                        <p className="text-sm mb-3">{comment.content}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            סטטוס: {comment.status === 'approved' ? 'אושר' : 'ממתין'}
                          </span>
                          <span>{new Date(comment.created_at).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>עדיין לא כתבת הודעות</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">הגדרות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">שינוי סיסמה</h4>
                  <Button variant="outline" size="sm">שנה סיסמה</Button>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-medium mb-3">העדפות התראות</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" defaultChecked />
                      <span className="text-sm">התראות על קורסים חדשים</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" defaultChecked />
                      <span className="text-sm">התראות על תגובות</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
