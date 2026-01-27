import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCalendarData, CalendarEventFormData, getEventTypeLabel } from '@/hooks/useCalendarData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const defaultFormData: CalendarEventFormData = {
  title: '',
  description: '',
  event_type: 'other',
  start_datetime: '',
  end_datetime: '',
  location: '',
  external_link: '',
  attachment_url: '',
  access_type: 'all',
  is_active: true,
  visibility_modules: [],
  visibility_bundles: []
};

const CalendarPage = () => {
  const {
    allEvents,
    eventsLoading,
    fetchEventVisibility,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleEventActive,
    isCreating,
    isUpdating
  } = useCalendarData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CalendarEventFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch modules for visibility selection
  const { data: modules = [] } = useQuery({
    queryKey: ['admin-modules-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    }
  });

  // Fetch bundles for visibility selection
  const { data: bundles = [] } = useQuery({
    queryKey: ['admin-bundles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundles')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    }
  });

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = async (eventId: string) => {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    const visibility = await fetchEventVisibility(eventId);
    
    setEditingId(eventId);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_datetime: event.start_datetime.slice(0, 16),
      end_datetime: event.end_datetime?.slice(0, 16) || '',
      location: event.location || '',
      external_link: event.external_link || '',
      attachment_url: event.attachment_url || '',
      access_type: event.access_type as 'all' | 'restricted',
      is_active: event.is_active,
      visibility_modules: visibility.filter(v => v.module_id).map(v => v.module_id!),
      visibility_bundles: visibility.filter(v => v.bundle_id).map(v => v.bundle_id!)
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateEvent({ id: editingId, formData }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    } else {
      createEvent(formData, {
        onSuccess: () => setIsDialogOpen(false)
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteEvent(id, {
      onSuccess: () => setDeleteConfirmId(null)
    });
  };

  const toggleVisibilityModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      visibility_modules: prev.visibility_modules.includes(moduleId)
        ? prev.visibility_modules.filter(id => id !== moduleId)
        : [...prev.visibility_modules, moduleId]
    }));
  };

  const toggleVisibilityBundle = (bundleId: string) => {
    setFormData(prev => ({
      ...prev,
      visibility_bundles: prev.visibility_bundles.includes(bundleId)
        ? prev.visibility_bundles.filter(id => id !== bundleId)
        : [...prev.visibility_bundles, bundleId]
    }));
  };

  if (eventsLoading) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">יומן</h1>
          <p className="text-muted-foreground">ניהול אירועים, מפגשים ודדליינים</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          אירוע חדש
        </Button>
      </div>

      {allEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין אירועים</h3>
            <p className="text-muted-foreground mb-4">לחץ על "אירוע חדש" כדי ליצור את האירוע הראשון</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allEvents.map(event => (
            <Card key={event.id} className={!event.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                      {!event.is_active && (
                        <Badge variant="secondary">לא פעיל</Badge>
                      )}
                      <Badge variant={event.access_type === 'all' ? 'default' : 'secondary'}>
                        {event.access_type === 'all' ? 'כולם' : 'מוגבל'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(event.start_datetime), 'dd/MM/yyyy', { locale: he })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(event.start_datetime), 'HH:mm', { locale: he })}
                        {event.end_datetime && (
                          <> - {format(new Date(event.end_datetime), 'HH:mm', { locale: he })}</>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.external_link && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" />
                          <a href={event.external_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            קישור
                          </a>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleEventActive({ id: event.id, is_active: !event.is_active })}
                      title={event.is_active ? 'השבת' : 'הפעל'}
                    >
                      {event.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(event.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(event.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת אירוע' : 'יצירת אירוע חדש'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">כותרת *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="כותרת האירוע"
              />
            </div>

            <div>
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור האירוע"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="event_type">סוג אירוע</Label>
              <Select
                value={formData.event_type}
                onValueChange={value => setFormData(prev => ({ ...prev, event_type: value as CalendarEventFormData['event_type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live_lesson">שיעור חי</SelectItem>
                  <SelectItem value="deadline">דדליין</SelectItem>
                  <SelectItem value="meeting">מפגש</SelectItem>
                  <SelectItem value="broadcast">שידור</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_datetime">תאריך ושעת התחלה *</Label>
                <Input
                  id="start_datetime"
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={e => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_datetime">תאריך ושעת סיום</Label>
                <Input
                  id="end_datetime"
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={e => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">מיקום</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="מיקום האירוע"
              />
            </div>

            <div>
              <Label htmlFor="external_link">קישור חיצוני</Label>
              <Input
                id="external_link"
                value={formData.external_link}
                onChange={e => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                placeholder="https://zoom.us/..."
              />
            </div>

            <div>
              <Label htmlFor="attachment_url">קישור לקובץ מצורף</Label>
              <Input
                id="attachment_url"
                value={formData.attachment_url}
                onChange={e => setFormData(prev => ({ ...prev, attachment_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>הרשאות צפייה</Label>
              <Select
                value={formData.access_type}
                onValueChange={value => setFormData(prev => ({ ...prev, access_type: value as 'all' | 'restricted' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המשתמשים המחוברים</SelectItem>
                  <SelectItem value="restricted">משתמשים רשומים לקורסים/חבילות ספציפיות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.access_type === 'restricted' && (
              <>
                <div>
                  <Label className="mb-2 block">קורסים</Label>
                  <div className="flex flex-wrap gap-2">
                    {modules.map(module => (
                      <Badge
                        key={module.id}
                        variant={formData.visibility_modules.includes(module.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleVisibilityModule(module.id)}
                      >
                        {module.title}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">חבילות</Label>
                  <div className="flex flex-wrap gap-2">
                    {bundles.map(bundle => (
                      <Badge
                        key={bundle.id}
                        variant={formData.visibility_bundles.includes(bundle.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleVisibilityBundle(bundle.id)}
                      >
                        {bundle.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">פעיל</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.title || !formData.start_datetime || isCreating || isUpdating}
            >
              {editingId ? 'עדכון' : 'יצירה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>מחיקת אירוע</DialogTitle>
          </DialogHeader>
          <p>האם אתה בטוח שברצונך למחוק את האירוע? פעולה זו אינה ניתנת לביטול.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              ביטול
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
