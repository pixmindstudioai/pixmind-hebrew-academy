import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Settings, Activity, Search, Filter, RefreshCw, Check, X, Play, Clock, User, Wrench, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminShell from '@/components/admin/AdminShell';
import { useToolSettings, useUpdateToolSetting, useToolUsageLogs, TOOL_CATEGORIES, TOOL_ICONS, useMCPTool } from '@/hooks/useMCPTools';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MCPToolsPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAdminRole();
  const { data: toolSettings, isLoading: settingsLoading, refetch: refetchSettings } = useToolSettings();
  const { data: usageLogs, isLoading: logsLoading, refetch: refetchLogs } = useToolUsageLogs({ limit: 200 });
  const updateTool = useUpdateToolSetting();
  const { callTool, isLoading: toolLoading } = useMCPTool();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    navigate('/admin');
    return null;
  }

  const filteredTools = (toolSettings || []).filter(tool => {
    const matchesSearch = tool.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description_he?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredLogs = (usageLogs || []).filter(log => {
    const matchesSearch = log.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleTool = async (toolName: string, enabled: boolean) => {
    try {
      await updateTool.mutateAsync({ toolName, updates: { is_enabled: enabled } });
      toast.success(enabled ? 'הכלי הופעל' : 'הכלי הושבת');
    } catch (error) {
      toast.error('שגיאה בעדכון הכלי');
    }
  };

  const handleTestTool = async () => {
    if (!selectedTool) return;

    try {
      const params = JSON.parse(testParams);
      const result = await callTool(selectedTool, params);
      setTestResult(result);
      if (!result.success) {
        toast.error(result.error || 'שגיאה בהרצת הכלי');
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
      toast.error('JSON לא תקין');
    }
  };

  const openTestDialog = (toolName: string) => {
    setSelectedTool(toolName);
    setTestParams('{}');
    setTestResult(null);
    setTestDialogOpen(true);
  };

  // Stats
  const totalTools = toolSettings?.length || 0;
  const enabledTools = toolSettings?.filter(t => t.is_enabled).length || 0;
  const todayLogs = usageLogs?.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length || 0;
  const errorLogs = usageLogs?.filter(l => l.status === 'error').length || 0;

  const categoryGroups = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof filteredTools>);

  return (
    <AdminShell>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              כלי MCP
            </h1>
            <p className="text-muted-foreground mt-1">
              ניהול כלי AI עבור תלמידים ומנהלים
            </p>
          </div>
          <Button onClick={() => { refetchSettings(); refetchLogs(); }} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalTools}</p>
                  <p className="text-sm text-muted-foreground">סה"כ כלים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enabledTools}</p>
                  <p className="text-sm text-muted-foreground">כלים פעילים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayLogs}</p>
                  <p className="text-sm text-muted-foreground">קריאות היום</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{errorLogs}</p>
                  <p className="text-sm text-muted-foreground">שגיאות</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tools" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tools" className="gap-2">
              <Settings className="w-4 h-4" />
              הגדרות כלים
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="w-4 h-4" />
              לוג שימוש
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              סטטיסטיקות
            </TabsTrigger>
          </TabsList>

          {/* Tools Settings Tab */}
          <TabsContent value="tools" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="חפש כלי..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {Object.entries(TOOL_CATEGORIES).map(([key, cat]) => (
                        <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tools List */}
            {settingsLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  טוען כלים...
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(categoryGroups).map(([category, tools]) => (
                  <Card key={category}>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">
                        {TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES]?.label || category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="divide-y">
                        {tools.map(tool => (
                          <div key={tool.tool_name} className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{TOOL_ICONS[tool.tool_name] || '🔧'}</span>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {tool.tool_name}
                                  {tool.allowed_roles.includes('admin') && !tool.allowed_roles.includes('student') && (
                                    <Badge variant="secondary" className="text-xs">מנהל בלבד</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{tool.description_he}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTestDialog(tool.tool_name)}
                              >
                                <Play className="w-3 h-3 ml-1" />
                                בדיקה
                              </Button>
                              <Switch
                                checked={tool.is_enabled}
                                onCheckedChange={(checked) => handleToggleTool(tool.tool_name, checked)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="חפש לפי כלי או משתמש..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="success">הצלחה</SelectItem>
                      <SelectItem value="error">שגיאה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">כלי</TableHead>
                        <TableHead className="text-right">משתמש</TableHead>
                        <TableHead className="text-right">תפקיד</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">זמן ביצוע</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">טוען לוגים...</TableCell>
                        </TableRow>
                      ) : filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            אין לוגים להצגה
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{TOOL_ICONS[log.tool_name] || '🔧'}</span>
                                <span className="font-mono text-sm">{log.tool_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{log.actor_email}</TableCell>
                            <TableCell>
                              <Badge variant={log.actor_role === 'admin' ? 'default' : 'secondary'}>
                                {log.actor_role === 'admin' ? 'מנהל' : 'תלמיד'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                {log.status === 'success' ? 'הצלחה' : 'שגיאה'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.execution_time_ms ? `${log.execution_time_ms}ms` : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: he })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>סטטיסטיקות שימוש</CardTitle>
                <CardDescription>נתונים מצטברים על השימוש בכלי MCP</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tool usage breakdown */}
                <div className="space-y-4">
                  <h4 className="font-medium">כלים פופולריים</h4>
                  {(() => {
                    const toolCounts = (usageLogs || []).reduce((acc: any, log) => {
                      acc[log.tool_name] = (acc[log.tool_name] || 0) + 1;
                      return acc;
                    }, {});
                    const sorted = Object.entries(toolCounts)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10);

                    return sorted.map(([toolName, count]) => (
                      <div key={toolName} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center gap-2">
                          <span>{TOOL_ICONS[toolName] || '🔧'}</span>
                          <span>{toolName}</span>
                        </div>
                        <Badge variant="secondary">{count as number} קריאות</Badge>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Tool Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                בדיקת כלי: {selectedTool}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>פרמטרים (JSON)</Label>
                <Textarea
                  value={testParams}
                  onChange={(e) => setTestParams(e.target.value)}
                  placeholder='{"lessonId": "...", "language": "he"}'
                  className="font-mono text-sm h-32"
                  dir="ltr"
                />
              </div>
              <Button onClick={handleTestTool} disabled={toolLoading} className="w-full">
                {toolLoading ? 'מריץ...' : 'הרץ כלי'}
              </Button>
              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="font-medium mb-2">
                    {testResult.success ? '✅ הצלחה' : '❌ שגיאה'}
                  </div>
                  <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap" dir="ltr">
                    {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
