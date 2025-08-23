import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, BookOpen, MessageCircle, LogOut, Edit, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useModules, useUserProgress, useUpdateProgress } from '@/hooks/useContentData';
import Navigation from '@/components/Navigation';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  const [error, setError] = useState('');

  // Use individual hooks
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

      // Fetch user comments
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

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
      });

      if (error) {
        setError('שגיאה בעדכון הפרופיל');
      } else {
        toast({
          title: "פרופיל עודכן בהצלחה!",
          description: "הפרטים שלך נשמרו",
        });
        setIsEditing(false);
      }
    } catch (err) {
      setError('שגיאה לא צפויה. אנא נסה שוב');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להתנתק. אנא נסה שוב",
        variant: "destructive"
      });
    } else {
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
      navigate('/');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getModuleProgress = (moduleId: string) => {
    // This is a simplified calculation - you might want to improve this logic
    const moduleProgressEntries = userProgress.filter(p => p.lesson_id);
    const completedLessons = moduleProgressEntries.filter(p => p.completed).length;
    const totalLessons = moduleProgressEntries.length || 1;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">טוען פרופיל...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="glass-card p-8 rounded-xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold gradient-text">הפרופיל שלי</h1>
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

          <div className="flex items-center space-x-6 space-x-reverse">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" />
                <AvatarFallback className="text-xl">
                  {getInitials(formData.fullName || 'משתמש')}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -left-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      שם מלא
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="text-right"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      אימייל
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      className="text-right"
                      disabled
                    />
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
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
                  <h2 className="text-2xl font-semibold mb-2">{formData.fullName || 'משתמש'}</h2>
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
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="courses" className="flex items-center space-x-2 space-x-reverse">
              <BookOpen className="w-4 h-4" />
              <span>הקורסים שלי</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center space-x-2 space-x-reverse">
              <MessageCircle className="w-4 h-4" />
              <span>הודעות שלי</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-4 h-4" />
              <span>הגדרות</span>
            </TabsTrigger>
          </TabsList>

          {/* My Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6">הקורסים שלי</h3>
              {modules.length > 0 ? (
                <div className="grid gap-4">
                  {modules.map((module) => {
                    const progress = getModuleProgress(module.id);
                    return (
                      <div key={module.id} className="border border-border/50 rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{module.title}</h4>
                          <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="progress-gradient h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  עדיין לא נרשמת לאף קורס
                </p>
              )}
            </div>
          </TabsContent>

          {/* My Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6">הודעות שלי</h3>
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.slice(0, 10).map((comment) => (
                    <div key={comment.id} className="border border-border/50 rounded-lg p-4">
                      <p className="text-sm mb-2">{comment.content}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>סטטוס: {comment.status === 'approved' ? 'אושר' : 'ממתין לאישור'}</span>
                        <span>{new Date(comment.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  עדיין לא כתבת הודעות
                </p>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6">הגדרות</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">שינוי סיסמה</h4>
                  <Button variant="outline">
                    שנה סיסמה
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">העדפות התראות</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">התראות על קורסים חדשים</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">התראות על תגובות</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
