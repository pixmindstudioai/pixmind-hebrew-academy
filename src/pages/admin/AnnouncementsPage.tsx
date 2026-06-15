import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { 
  useAdminAnnouncements, 
  useCreateAnnouncement, 
  useUpdateAnnouncement, 
  useDeleteAnnouncement,
  useAnnouncementVisibility,
  useAddAnnouncementVisibility,
  useRemoveAnnouncementVisibility,
  Announcement 
} from '@/hooks/useAnnouncementsData';
import { useModules } from '@/hooks/useAdminData';
import { useAdminBundles } from '@/hooks/useAdminBundlesData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Pin, 
  Globe,
  Shield,
  X,
  BookOpen,
  Package,
  Calendar,
  Megaphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const AnnouncementsPage = () => {
  const { data: adminData, isLoading: adminLoading } = useAdminRole();
  const { data: announcements, isLoading } = useAdminAnnouncements();
  const { data: modules } = useModules();
  const { data: bundles } = useAdminBundles();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForVisibility, setSelectedForVisibility] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    is_active: true,
    is_pinned: false,
    access_type: 'all' as 'all' | 'restricted',
    publish_date: new Date().toISOString().slice(0, 16),
    expire_date: '',
  });
  
  if (adminLoading || !adminData?.isAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        אין הרשאה לבצע פעולה זו
      </div>
    );
  }
  
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      is_active: true,
      is_pinned: false,
      access_type: 'all',
      publish_date: new Date().toISOString().slice(0, 16),
      expire_date: '',
    });
    setEditingAnnouncement(null);
  };
  
  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      image_url: announcement.image_url || '',
      is_active: announcement.is_active,
      is_pinned: announcement.is_pinned,
      access_type: announcement.access_type,
      publish_date: announcement.publish_date.slice(0, 16),
      expire_date: announcement.expire_date?.slice(0, 16) || '',
    });
    setEditingAnnouncement(announcement);
    setIsCreateOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      expire_date: formData.expire_date || null,
    };
    
    if (editingAnnouncement) {
      await updateAnnouncement.mutateAsync({ id: editingAnnouncement.id, ...payload });
    } else {
      await createAnnouncement.mutateAsync(payload);
    }
    
    setIsCreateOpen(false);
    resetForm();
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('האם למחוק את ההכרזה?')) {
      await deleteAnnouncement.mutateAsync(id);
    }
  };
  
  const toggleActive = async (announcement: Announcement) => {
    await updateAnnouncement.mutateAsync({ 
      id: announcement.id, 
      is_active: !announcement.is_active 
    });
  };
  
  const togglePinned = async (announcement: Announcement) => {
    await updateAnnouncement.mutateAsync({ 
      id: announcement.id, 
      is_pinned: !announcement.is_pinned 
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">הכרזות</h1>
          <p className="text-muted-foreground">ניהול הכרזות והודעות למשתמשים</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              הכרזה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'עריכת הכרזה' : 'הכרזה חדשה'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>כותרת</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="כותרת ההכרזה"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>תוכן</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="תוכן ההכרזה..."
                  rows={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>קישור לתמונה (אופציונלי)</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תאריך פרסום</Label>
                  <Input
                    type="datetime-local"
                    value={formData.publish_date}
                    onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>תאריך תפוגה (אופציונלי)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expire_date}
                    onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>הרשאות צפייה</Label>
                <Select
                  value={formData.access_type}
                  onValueChange={(value: 'all' | 'restricted') => 
                    setFormData({ ...formData, access_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        כל המשתמשים המחוברים
                      </div>
                    </SelectItem>
                    <SelectItem value="restricted">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        רק רשומים לקורסים/חבילות מסוימות
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label>הכרזה פעילה</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label>הצמד למעלה</Label>
                <Switch
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAnnouncement ? 'עדכן' : 'צור הכרזה'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : announcements?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין הכרזות</h3>
            <p className="text-muted-foreground mb-4">צור הכרזה חדשה כדי להתחיל</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements?.map((announcement) => (
            <Card key={announcement.id} className={!announcement.is_active ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      {announcement.is_pinned && (
                        <Badge variant="secondary" className="gap-1">
                          <Pin className="w-3 h-3" />
                          מוצמד
                        </Badge>
                      )}
                      <Badge variant={announcement.is_active ? 'default' : 'outline'}>
                        {announcement.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {announcement.access_type === 'all' ? (
                          <>
                            <Globe className="w-3 h-3" />
                            כולם
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3" />
                            מוגבל
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {announcement.content}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        פרסום: {format(new Date(announcement.publish_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </span>
                      {announcement.expire_date && (
                        <span>
                          תפוגה: {format(new Date(announcement.expire_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(announcement)}
                      className="gap-1"
                    >
                      {announcement.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {announcement.is_active ? 'בטל' : 'הפעל'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePinned(announcement)}
                      className="gap-1"
                    >
                      <Pin className="w-3 h-3" />
                      {announcement.is_pinned ? 'בטל הצמדה' : 'הצמד'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      ערוך
                    </Button>
                    
                    {announcement.access_type === 'restricted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedForVisibility(announcement.id)}
                        className="gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        הרשאות
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(announcement.id)}
                      className="gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      מחק
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <VisibilityDialog
        announcementId={selectedForVisibility}
        onClose={() => setSelectedForVisibility(null)}
        modules={modules || []}
        bundles={bundles || []}
      />
    </div>
  );
};

interface VisibilityDialogProps {
  announcementId: string | null;
  onClose: () => void;
  modules: Array<{ id: string; title: string }>;
  bundles: Array<{ id: string; title: string }>;
}

const VisibilityDialog = ({ announcementId, onClose, modules, bundles }: VisibilityDialogProps) => {
  const { data: visibilityRules, isLoading } = useAnnouncementVisibility(announcementId);
  const addVisibility = useAddAnnouncementVisibility();
  const removeVisibility = useRemoveAnnouncementVisibility();
  
  const [accessType, setAccessType] = useState<'module' | 'bundle'>('module');
  const [selectedId, setSelectedId] = useState<string>('');
  
  const handleAdd = async () => {
    if (!announcementId || !selectedId) return;
    
    await addVisibility.mutateAsync({
      announcement_id: announcementId,
      module_id: accessType === 'module' ? selectedId : undefined,
      bundle_id: accessType === 'bundle' ? selectedId : undefined,
    });
    
    setSelectedId('');
  };
  
  const handleRemove = async (id: string) => {
    if (!announcementId) return;
    await removeVisibility.mutateAsync({ id, announcementId });
  };
  
  return (
    <Dialog open={!!announcementId} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול הרשאות צפייה</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={accessType} onValueChange={(v: 'module' | 'bundle') => setAccessType(v)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="module">קורס</SelectItem>
                <SelectItem value="bundle">חבילה</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={accessType === 'module' ? 'בחר קורס' : 'בחר חבילה'} />
              </SelectTrigger>
              <SelectContent>
                {accessType === 'module'
                  ? modules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                    ))
                  : bundles.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
            
            <Button onClick={handleAdd} disabled={!selectedId}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : visibilityRules?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              אין הרשאות צפייה מוגדרות
            </p>
          ) : (
            <div className="space-y-2">
              {visibilityRules?.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {rule.module_id ? (
                      <>
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>{rule.module?.title || 'קורס'}</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 text-primary" />
                        <span>{rule.bundle?.title || 'חבילה'}</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(rule.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementsPage;
