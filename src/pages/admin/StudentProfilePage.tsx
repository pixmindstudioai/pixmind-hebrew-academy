import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Calendar, Shield, Activity, BookOpen, RotateCcw, UserX, UserCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useStudentDetails, useUpdateUserStatus, useGrantModuleAccess, useRevokeModuleAccess, useResetModuleProgress } from '@/hooks/useStudentsData';
import { useModules } from '@/hooks/useContentData';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';

const StudentProfilePage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');

  const { data, isLoading } = useStudentDetails(studentId!);
  const { data: allModules } = useModules('all');
  const updateStatus = useUpdateUserStatus();
  const grantAccess = useGrantModuleAccess();
  const revokeAccess = useRevokeModuleAccess();
  const resetProgress = useResetModuleProgress();

  if (isLoading || !data) {
    return <div className="text-center py-8">טוען...</div>;
  }

  const { user, enrollments, progress, activity } = data;

  const handleGrantAccess = () => {
    if (selectedModule) {
      grantAccess.mutate(
        { userEmail: user.email, moduleId: selectedModule },
        { onSuccess: () => setEnrollDialogOpen(false) }
      );
    }
  };

  return (
    <AuthenticationGuard>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/students')}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">פרופיל תלמיד</h1>
            <p className="text-muted-foreground text-sm md:text-base">{user.email}</p>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profile_picture_url} />
                <AvatarFallback className="text-2xl">{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{user.full_name || 'ללא שם'}</h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">סטטוס</p>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="mt-1">
                      {user.status === 'active' ? 'פעיל' : 'חסום'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">הצטרף</p>
                    <p className="font-medium mt-1">{format(new Date(user.created_at), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">כניסה אחרונה</p>
                    <p className="font-medium mt-1">
                      {user.last_login_at ? format(new Date(user.last_login_at), 'dd/MM/yyyy') : 'לא התחבר'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">קורסים</p>
                    <p className="font-medium mt-1">{enrollments.length}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {user.status === 'active' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateStatus.mutate({ userId: user.id, status: 'blocked' })}
                    >
                      <UserX className="w-4 h-4 ml-2" />
                      חסום משתמש
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateStatus.mutate({ userId: user.id, status: 'active' })}
                    >
                      <UserCheck className="w-4 h-4 ml-2" />
                      שחרר חסימה
                    </Button>
                  )}
                  <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 ml-2" />
                        הרשם לקורס
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הרשמה לקורס</DialogTitle>
                      </DialogHeader>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קורס" />
                        </SelectTrigger>
                        <SelectContent>
                          {allModules?.filter(m => !enrollments.find(e => e.module_id === m.id)).map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>ביטול</Button>
                        <Button onClick={handleGrantAccess} disabled={!selectedModule}>הוסף</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="enrollments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enrollments">קורסים</TabsTrigger>
            <TabsTrigger value="progress">התקדמות</TabsTrigger>
            <TabsTrigger value="activity">פעילות</TabsTrigger>
          </TabsList>

          <TabsContent value="enrollments" className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>המשתמש לא רשום לאף קורס</p>
              </div>
            ) : (
              enrollments.map((enrollment: any) => (
                <Card key={enrollment.module_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{enrollment.module?.title || 'קורס לא ידוע'}</CardTitle>
                        <CardDescription className="mt-1">
                          ניתן ב-{format(new Date(enrollment.granted_at), 'dd/MM/yyyy')}
                          {enrollment.expires_at && ` • פג תוקף: ${format(new Date(enrollment.expires_at), 'dd/MM/yyyy')}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('האם לאפס את ההתקדמות בקורס זה?')) {
                              resetProgress.mutate({ userId: user.id, moduleId: enrollment.module_id });
                            }
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('האם להסיר את הגישה לקורס זה?')) {
                              revokeAccess.mutate({ userEmail: user.email, moduleId: enrollment.module_id });
                            }
                          }}
                        >
                          הסר
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {progress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין התקדמות עדיין</p>
              </div>
            ) : (
              progress.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.lesson?.title || 'שיעור לא ידוע'}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.lesson?.chapter?.module?.title} • {item.lesson?.chapter?.title}
                        </p>
                      </div>
                      <div className="text-left">
                        <Badge variant={item.completed ? 'default' : 'secondary'}>
                          {item.completed ? 'הושלם' : 'בתהליך'}
                        </Badge>
                        {item.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(item.completed_at), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {activity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין פעילות עדיין</p>
              </div>
            ) : (
              activity.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{item.action_type}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</p>
                        {item.action_details && (
                          <pre className="text-xs mt-2 text-muted-foreground">{JSON.stringify(item.action_details, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticationGuard>
  );
};

export default StudentProfilePage;
