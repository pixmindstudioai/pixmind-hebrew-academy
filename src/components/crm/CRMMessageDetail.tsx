import { useState } from 'react';
import { X, User, Mail, Calendar, Tag, MessageSquare, CheckCircle, Eye, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useCRMMessage, useUserMessageHistory, useUpdateMessageStatus, useAssignMessage, useUpdateMessage } from '@/hooks/useCRMData';
import { useStudents } from '@/hooks/useStudentsData';

interface CRMMessageDetailProps {
  messageId: string;
  onClose: () => void;
}

const messageTypeLabels = {
  support: 'תמיכה טכנית',
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

export const CRMMessageDetail = ({ messageId, onClose }: CRMMessageDetailProps) => {
  const { data: message, isLoading } = useCRMMessage(messageId);
  const { data: history = [] } = useUserMessageHistory(message?.user_email || '');
  const { data: staff = [] } = useStudents({});
  
  const updateStatus = useUpdateMessageStatus();
  const assignMessage = useAssignMessage();
  const updateMessage = useUpdateMessage();

  const [adminNotes, setAdminNotes] = useState('');
  const [newTag, setNewTag] = useState('');

  if (isLoading || !message) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען הודעה...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveNotes = () => {
    if (adminNotes.trim()) {
      updateMessage.mutate({
        messageId: message.id,
        adminNotes: message.admin_notes ? `${message.admin_notes}\n\n${adminNotes}` : adminNotes,
      });
      setAdminNotes('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = message.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        updateMessage.mutate({
          messageId: message.id,
          tags: [...currentTags, newTag.trim()],
        });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = message.tags || [];
    updateMessage.mutate({
      messageId: message.id,
      tags: currentTags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-bold">פרטי הודעה</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פרטי המשתמש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={message.user?.profile_picture_url} />
                <AvatarFallback>{getInitials(message.user_name || message.user_email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{message.user_name || 'ללא שם'}</p>
                <p className="text-sm text-muted-foreground">{message.user_email}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">תאריך שליחה</p>
                <p className="font-medium">{format(new Date(message.created_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">סטטוס</p>
                <Badge variant={message.status === 'new' ? 'default' : message.status === 'viewed' ? 'secondary' : 'outline'}>
                  {statusLabels[message.status]}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">תוכן ההודעה</CardTitle>
              <Badge variant="outline">{messageTypeLabels[message.message_type]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{message.message_text}</p>
            {message.module && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">קורס קשור</p>
                <p className="font-medium">{message.module.title}</p>
              </div>
            )}
            {message.lesson && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">שיעור קשור</p>
                <p className="font-medium">{message.lesson.title}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פעולות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>שנה סטטוס</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={message.status === 'viewed' ? 'default' : 'outline'}
                  onClick={() => updateStatus.mutate({ messageId: message.id, status: 'viewed' })}
                  disabled={updateStatus.isPending}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  סמן כנצפה
                </Button>
                <Button
                  size="sm"
                  variant={message.status === 'closed' ? 'default' : 'outline'}
                  onClick={() => updateStatus.mutate({ messageId: message.id, status: 'closed' })}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  סגור הודעה
                </Button>
              </div>
            </div>

            <div>
              <Label>הקצה לאיש צוות</Label>
              <Select
                value={message.assigned_to || 'unassigned'}
                onValueChange={(value) =>
                  assignMessage.mutate({
                    messageId: message.id,
                    assignedTo: value === 'unassigned' ? null : value,
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="בחר איש צוות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">לא מוקצה</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>תגיות</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {message.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="הוסף תגית"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button size="sm" onClick={handleAddTag}>
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הערות מנהל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {message.admin_notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{message.admin_notes}</p>
              </div>
            )}
            <Textarea
              placeholder="הוסף הערות פנימיות..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSaveNotes} disabled={!adminNotes.trim() || updateMessage.isPending}>
              שמור הערות
            </Button>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">היסטוריית הודעות מהמשתמש</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין היסטוריה</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {messageTypeLabels[msg.message_type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="line-clamp-2">{msg.message_text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
