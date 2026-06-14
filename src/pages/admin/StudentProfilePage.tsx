import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Calendar, Shield, Activity, BookOpen, RotateCcw, UserX, UserCheck, Plus, Sparkles, Award, Zap, TrendingUp, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useStudentDetails, useUpdateUserStatus, useGrantModuleAccess, useRevokeModuleAccess, useResetModuleProgress } from '@/hooks/useStudentsData';
import { useGrantXp, useAwardBadge, useUserXpLedger } from '@/hooks/useAdminGamification';
import { useEarnedBadges } from '@/hooks/useGamification';
import { useModules } from '@/hooks/useContentData';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';
import { StatTile, BadgeGrid, type BadgeItem } from '@/components/gamification';
import { getLevelInfo, levelTitle } from '@/lib/levels';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const StudentProfilePage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');

  // Gamification grant dialogs
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const [xpAmount, setXpAmount] = useState<string>('50');
  const [xpReason, setXpReason] = useState('');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');

  const { data, isLoading } = useStudentDetails(studentId!);
  const { data: allModules } = useModules('all');
  const updateStatus = useUpdateUserStatus();
  const grantAccess = useGrantModuleAccess();
  const revokeAccess = useRevokeModuleAccess();
  const resetProgress = useResetModuleProgress();

  // Gamification hooks
  const grantXp = useGrantXp();
  const awardBadge = useAwardBadge();
  const { data: earnedBadges } = useEarnedBadges(studentId);
  const { data: xpLedger } = useUserXpLedger(studentId);
  const { data: activeBadges } = useQuery({
    queryKey: ['active-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return <div className="text-center py-8">טוען...</div>;
  }

  const { user, enrollments, progress, activity } = data;

  const xpTotal = user.xp_total ?? 0;
  const levelInfo = getLevelInfo(xpTotal);

  const handleGrantAccess = () => {
    if (selectedModule) {
      grantAccess.mutate(
        { userEmail: user.email, moduleId: selectedModule },
        { onSuccess: () => setEnrollDialogOpen(false) }
      );
    }
  };

  const handleGrantXp = () => {
    const amount = parseInt(xpAmount, 10);
    if (!amount || amount <= 0) return;
    grantXp.mutate(
      { userId: user.id, amount, reason: xpReason || undefined },
      {
        onSuccess: () => {
          setXpDialogOpen(false);
          setXpReason('');
          setXpAmount('50');
        },
      }
    );
  };

  const handleAwardBadge = () => {
    if (!selectedBadgeId) return;
    const badge = activeBadges?.find((b) => b.id === selectedBadgeId);
    awardBadge.mutate(
      { userId: user.id, badgeId: selectedBadgeId, xpBonus: badge?.xp_bonus ?? 0 },
      {
        onSuccess: () => {
          setBadgeDialogOpen(false);
          setSelectedBadgeId('');
        },
      }
    );
  };

  const earnedBadgeItems: BadgeItem[] = (earnedBadges ?? []).map((b) => ({
    code: b.code,
    name: b.name,
    description: b.description,
    icon: b.icon,
    tier: b.tier,
    earned: true,
  }));

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

                {/* Gamification summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatTile icon={Zap} label="XP" value={xpTotal} accent />
                  <StatTile
                    icon={TrendingUp}
                    label="רמה"
                    value={levelInfo.level}
                    sub={levelTitle(levelInfo.level)}
                  />
                  <StatTile icon={Flame} label="רצף נוכחי" value={user.current_streak ?? 0} sub="ימים" />
                  <StatTile icon={Award} label="רצף שיא" value={user.longest_streak ?? 0} sub="ימים" />
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

                  {/* Grant XP */}
                  <Dialog open={xpDialogOpen} onOpenChange={setXpDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Zap className="w-4 h-4 ml-2 text-primary" />
                        הענק XP
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הענקת XP ידנית</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="xp-amount">כמות XP</Label>
                          <Input
                            id="xp-amount"
                            type="number"
                            min={1}
                            value={xpAmount}
                            onChange={(e) => setXpAmount(e.target.value)}
                            placeholder="50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="xp-reason">סיבה (אופציונלי)</Label>
                          <Textarea
                            id="xp-reason"
                            value={xpReason}
                            onChange={(e) => setXpReason(e.target.value)}
                            placeholder="למשל: השתתפות פעילה בקהילה"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setXpDialogOpen(false)}>ביטול</Button>
                        <Button
                          onClick={handleGrantXp}
                          disabled={!parseInt(xpAmount, 10) || parseInt(xpAmount, 10) <= 0 || grantXp.isPending}
                        >
                          הענק
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Award badge */}
                  <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Award className="w-4 h-4 ml-2 text-primary" />
                        הענק תג
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הענקת תג</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>בחר תג</Label>
                        <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר תג" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeBadges?.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}{b.xp_bonus ? ` (+${b.xp_bonus} XP)` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBadgeDialogOpen(false)}>ביטול</Button>
                        <Button onClick={handleAwardBadge} disabled={!selectedBadgeId || awardBadge.isPending}>
                          הענק תג
                        </Button>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="enrollments">קורסים</TabsTrigger>
            <TabsTrigger value="progress">התקדמות</TabsTrigger>
            <TabsTrigger value="achievements">הישגים</TabsTrigger>
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

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  תגים שהושגו
                </CardTitle>
                <CardDescription>{earnedBadgeItems.length} תגים</CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeGrid badges={earnedBadgeItems} emptyText="התלמיד עדיין לא השיג תגים" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  היסטוריית XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!xpLedger || xpLedger.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">אין רשומות XP עדיין</p>
                ) : (
                  <div className="divide-y divide-border">
                    {xpLedger.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{entry.reason || entry.source_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold ${
                            entry.amount >= 0 ? 'text-primary' : 'text-destructive'
                          }`}
                        >
                          {entry.amount >= 0 ? '+' : ''}{entry.amount} XP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
