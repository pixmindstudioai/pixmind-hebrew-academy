import { BarChart, TrendingUp, MessageSquare, Clock, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCRMAnalytics } from '@/hooks/useCRMData';
import { useModules } from '@/hooks/useContentData';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';

const messageTypeLabels = {
  support: 'תמיכה טכנית',
  question: 'שאלות',
  feedback: 'משוב',
  purchase: 'רכישות',
  general: 'כללי',
};

const CRMAnalyticsPage = () => {
  const { data: analytics, isLoading } = useCRMAnalytics();
  const { data: modules = [] } = useModules('all');

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const topModules = Object.entries(analytics.messagesByModule)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([moduleId, count]) => ({
      module: modules.find((m) => m.id === moduleId),
      count,
    }));

  return (
    <AuthenticationGuard>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">ניתוח CRM</h1>
          <p className="text-muted-foreground mt-2">סטטיסטיקות ותובנות על פניות התלמידים</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">סה"כ הודעות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold">{analytics.totalMessages}</div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">30 ימים אחרונים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold">{analytics.messagesLast30Days}</div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">7 ימים אחרונים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold">{analytics.messagesLast7Days}</div>
                <BarChart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                זמן טיפול ממוצע (שעות)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold">
                  {analytics.avgResolutionTimeHours.toFixed(1)}
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>סטטוס הודעות</CardTitle>
            <CardDescription>פילוח לפי סטטוס</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">הודעות חדשות</p>
                <p className="text-2xl font-bold">{analytics.newMessages}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((analytics.newMessages / analytics.totalMessages) * 100).toFixed(1)}% מסך ההודעות
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">הודעות שנצפו</p>
                <p className="text-2xl font-bold">{analytics.viewedMessages}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((analytics.viewedMessages / analytics.totalMessages) * 100).toFixed(1)}% מסך ההודעות
                </p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">הודעות סגורות</p>
                <p className="text-2xl font-bold">{analytics.closedMessages}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((analytics.closedMessages / analytics.totalMessages) * 100).toFixed(1)}% מסך ההודעות
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Types */}
        <Card>
          <CardHeader>
            <CardTitle>סוגי הודעות</CardTitle>
            <CardDescription>פילוח לפי נושא</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.messagesByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="font-medium min-w-0 truncate">{messageTypeLabels[type as keyof typeof messageTypeLabels]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 sm:w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${((count as number) / analytics.totalMessages) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-bold w-12 text-left">{count as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Modules */}
        <Card>
          <CardHeader>
            <CardTitle>קורסים עם הכי הרבה פניות</CardTitle>
            <CardDescription>5 הקורסים המובילים</CardDescription>
          </CardHeader>
          <CardContent>
            {topModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין נתונים</p>
            ) : (
              <div className="space-y-3">
                {topModules.map(({ module, count }, index) => (
                  <div key={module?.id || index} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{module?.title || 'קורס לא ידוע'}</p>
                        <p className="text-xs text-muted-foreground">{count as number} פניות</p>
                      </div>
                    </div>
                    <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Per Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle>הודעות לפי יום (30 ימים אחרונים)</CardTitle>
            <CardDescription>מגמה יומית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 sm:h-48 flex items-end gap-px sm:gap-1">
              {Object.entries(analytics.messagesPerDay)
                .slice(-30)
                .map(([date, count]) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{
                        height: `${((count as number) / Math.max(...Object.values(analytics.messagesPerDay) as number[])) * 100}%`,
                        minHeight: count ? '4px' : '0',
                      }}
                      title={`${date}: ${count} הודעות`}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticationGuard>
  );
};

export default CRMAnalyticsPage;
