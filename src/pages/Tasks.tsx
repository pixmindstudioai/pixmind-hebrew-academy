import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  Clock,
  Trophy,
  Zap,
  ListChecks,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useUserTasks, getEffectiveStatus } from '@/hooks/useTasksData';
import { StatTile } from '@/components/gamification';
import { ChallengeCard, type ChallengeStatus } from '@/components/challenges/ChallengeCard';

const DEFAULT_XP = 50;

const Tasks = () => {
  const { data: tasks = [], isLoading, error } = useUserTasks();

  // Group tasks by module (preserve existing grouping behavior)
  const tasksByModule = tasks.reduce((acc, task) => {
    const moduleTitle = (task as any).lessons?.chapters?.modules?.title || 'ללא קורס';
    if (!acc[moduleTitle]) acc[moduleTitle] = [];
    acc[moduleTitle].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // Summary metrics
  const statusOf = (t: any): ChallengeStatus => getEffectiveStatus(t.submission);
  const approvedTasks = tasks.filter((t) => statusOf(t) === 'approved');
  const pendingCount = tasks.filter((t) => statusOf(t) === 'pending').length;
  const xpFromChallenges = approvedTasks.reduce(
    (sum, t) => sum + ((t as any).xp_reward ?? DEFAULT_XP),
    0
  );

  if (isLoading) {
    return (
      <AuthGuard>
        <div dir="rtl" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="mb-8 space-y-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div dir="rtl" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <Card className="glass-card mx-auto max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-foreground">שגיאה בטעינת האתגרים</p>
                <Button onClick={() => window.location.reload()}>נסה שוב</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div dir="rtl" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Hero */}
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Trophy className="h-6 w-6" />
            </span>
            <h1 className="gradient-text font-heading text-3xl font-bold sm:text-4xl">אתגרים</h1>
          </div>
          <p className="text-muted-foreground">השלם אתגרים, צבור XP, עלה רמות</p>
        </header>

        {/* Empty state */}
        {tasks.length === 0 ? (
          <Card className="glass-card text-center">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="h-8 w-8" />
              </span>
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground">אין אתגרים עדיין</h3>
                <p className="mt-1 text-muted-foreground">
                  האתגרים יופיעו כאן כשתתחיל ללמוד בקורסים
                </p>
              </div>
              <Button asChild className="button-glow">
                <Link to="/courses">עבור לקורסים</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary stats */}
            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile
                icon={CheckCircle}
                label="אתגרים שאושרו"
                value={approvedTasks.length}
              />
              <StatTile icon={Clock} label="ממתינים" value={pendingCount} />
              <StatTile
                icon={Zap}
                label="XP מאתגרים"
                value={xpFromChallenges.toLocaleString()}
                accent
              />
              <StatTile icon={ListChecks} label="סך הכל אתגרים" value={tasks.length} />
            </div>

            {/* Challenge cards grouped by module */}
            <div className="space-y-8">
              {Object.entries(tasksByModule).map(([moduleTitle, moduleTasks]) => (
                <section key={moduleTitle}>
                  <h2 className="mb-4 flex flex-wrap items-center gap-2 font-heading text-lg font-semibold text-foreground">
                    <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                    {moduleTitle}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({moduleTasks.length})
                    </span>
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    {moduleTasks.map((task: any) => (
                      <ChallengeCard
                        key={task.id}
                        taskId={task.id}
                        lessonTitle={task.lessons?.title || 'שיעור לא ידוע'}
                        chapterTitle={task.lessons?.chapters?.title || ''}
                        moduleTitle={task.lessons?.chapters?.modules?.title || moduleTitle}
                        xpReward={task.xp_reward ?? DEFAULT_XP}
                        status={statusOf(task)}
                        isMandatory={task.is_mandatory}
                        submittedAt={task.submission?.created_at ?? null}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
};

export default Tasks;
