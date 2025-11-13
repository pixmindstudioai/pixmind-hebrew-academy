import { useState } from 'react';
import { Search, Filter, RefreshCw, Mail, Eye, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useCRMMessages, useCRMRealtime, CRMFilters } from '@/hooks/useCRMData';
import { useModules } from '@/hooks/useContentData';
import { CRMMessageDetail } from '@/components/crm/CRMMessageDetail';
import AuthenticationGuard from '@/components/admin/AuthenticationGuard';

const messageTypeLabels = {
  support: 'תמיכה',
  question: 'שאלה',
  feedback: 'משוב',
  purchase: 'רכישה',
  general: 'כללי',
};

const statusLabels = {
  new: 'חדש',
  viewed: 'נצפה',
  closed: 'סגור',
};

const CRMInboxPage = () => {
  const [filters, setFilters] = useState<CRMFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const { data: messages = [], isLoading, refetch } = useCRMMessages({ ...filters, searchTerm });
  const { data: modules = [] } = useModules('all');

  // Enable realtime updates
  useCRMRealtime();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Mail className="h-4 w-4" />;
      case 'viewed':
        return <Eye className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <AuthenticationGuard>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">תיבת דואר CRM</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            ניהול הודעות ופניות מתלמידים
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">הודעות חדשות</p>
                  <p className="text-2xl font-bold">
                    {messages.filter((m) => m.status === 'new').length}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">נצפו</p>
                  <p className="text-2xl font-bold">
                    {messages.filter((m) => m.status === 'viewed').length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סגורות</p>
                  <p className="text-2xl font-bold">
                    {messages.filter((m) => m.status === 'closed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ</p>
                  <p className="text-2xl font-bold">{messages.length}</p>
                </div>
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-3 md:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : (value as any),
                }))
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="new">חדשות</SelectItem>
                <SelectItem value="viewed">נצפו</SelectItem>
                <SelectItem value="closed">סגורות</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.messageType || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  messageType: value === 'all' ? undefined : (value as any),
                }))
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל הסוגים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="support">תמיכה</SelectItem>
                <SelectItem value="question">שאלה</SelectItem>
                <SelectItem value="feedback">משוב</SelectItem>
                <SelectItem value="purchase">רכישה</SelectItem>
                <SelectItem value="general">כללי</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.moduleId || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, moduleId: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="כל הקורסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקורסים</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setFilters({})} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-2" />
              אפס סינון
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="חיפוש לפי שם, אימייל או תוכן..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="text-sm"
            />
            <Button onClick={handleSearch} size="sm" className="shrink-0">
              <Search className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">חפש</span>
            </Button>
          </div>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">טוען הודעות...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">אין הודעות</p>
            <p className="text-sm">נסה לשנות את הסינונים או החיפוש</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <Card
                key={message.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedMessageId(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={message.user?.profile_picture_url} />
                      <AvatarFallback>
                        {getInitials(message.user_name || message.user_email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{message.user_name || 'ללא שם'}</p>
                          <Badge variant="outline" className="text-xs">
                            {messageTypeLabels[message.message_type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              message.status === 'new'
                                ? 'default'
                                : message.status === 'viewed'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {getStatusIcon(message.status)}
                            <span className="mr-1">{statusLabels[message.status]}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{message.user_email}</p>
                      <p className="text-sm line-clamp-2">{message.message_text}</p>
                      {message.module && (
                        <p className="text-xs text-muted-foreground mt-2">
                          קורס: {message.module.title}
                        </p>
                      )}
                      {message.tags && message.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Sheet */}
      <Sheet open={!!selectedMessageId} onOpenChange={() => setSelectedMessageId(null)}>
        <SheetContent side="left" className="w-full sm:max-w-xl p-0">
          {selectedMessageId && (
            <CRMMessageDetail messageId={selectedMessageId} onClose={() => setSelectedMessageId(null)} />
          )}
        </SheetContent>
      </Sheet>
    </AuthenticationGuard>
  );
};

export default CRMInboxPage;
