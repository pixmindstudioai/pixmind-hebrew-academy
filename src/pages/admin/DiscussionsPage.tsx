import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { 
  useAdminGroups, 
  useCreateGroup, 
  useUpdateGroup, 
  useDeleteGroup,
  useGroupAccess,
  useAddGroupAccess,
  useRemoveGroupAccess,
  DiscussionGroup 
} from '@/hooks/useDiscussionsData';
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
  Users, 
  MessageSquare, 
  Lock, 
  Unlock,
  Globe,
  Shield,
  X,
  BookOpen,
  Package
} from 'lucide-react';

const DiscussionsPage = () => {
  const { data: adminData, isLoading: adminLoading } = useAdminRole();
  const { data: groups, isLoading: groupsLoading } = useAdminGroups();
  const { data: modules } = useModules();
  const { data: bundles } = useAdminBundles();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  
  const [editingGroup, setEditingGroup] = useState<DiscussionGroup | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroupForAccess, setSelectedGroupForAccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: true,
    allow_posting: true,
    access_type: 'restricted' as 'open' | 'restricted',
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
      description: '',
      is_active: true,
      allow_posting: true,
      access_type: 'restricted',
    });
    setEditingGroup(null);
  };
  
  const handleEdit = (group: DiscussionGroup) => {
    setFormData({
      title: group.title,
      description: group.description || '',
      is_active: group.is_active,
      allow_posting: group.allow_posting,
      access_type: group.access_type,
    });
    setEditingGroup(group);
    setIsCreateOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGroup) {
      await updateGroup.mutateAsync({ id: editingGroup.id, ...formData });
    } else {
      await createGroup.mutateAsync(formData);
    }
    
    setIsCreateOpen(false);
    resetForm();
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('האם למחוק את הקבוצה? פעולה זו תמחק גם את כל הפוסטים והתגובות.')) {
      await deleteGroup.mutateAsync(id);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">קבוצות ודיונים</h1>
          <p className="text-muted-foreground">ניהול קבוצות דיון ופורומים</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              קבוצה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'עריכת קבוצה' : 'קבוצה חדשה'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>שם הקבוצה</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="הזן שם לקבוצה"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תיאור הקבוצה"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>סוג גישה</Label>
                <Select
                  value={formData.access_type}
                  onValueChange={(value: 'open' | 'restricted') => 
                    setFormData({ ...formData, access_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        פתוחה לכל המשתמשים
                      </div>
                    </SelectItem>
                    <SelectItem value="restricted">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        מוגבלת לקורסים/חבילות
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label>קבוצה פעילה</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label>אפשר פרסום פוסטים</Label>
                <Switch
                  checked={formData.allow_posting}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_posting: checked })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingGroup ? 'עדכן' : 'צור קבוצה'}
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
      
      {groupsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין קבוצות דיון</h3>
            <p className="text-muted-foreground mb-4">צור קבוצה חדשה כדי להתחיל</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Card key={group.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{group.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={group.is_active ? 'default' : 'secondary'}>
                        {group.is_active ? 'פעילה' : 'לא פעילה'}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {group.access_type === 'open' ? (
                          <>
                            <Globe className="w-3 h-3" />
                            פתוחה
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3" />
                            מוגבלת
                          </>
                        )}
                      </Badge>
                      {group.allow_posting ? (
                        <Badge variant="outline" className="gap-1">
                          <Unlock className="w-3 h-3" />
                          פרסום מאושר
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="w-3 h-3" />
                          פרסום חסום
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {group.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                    className="gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    ערוך
                  </Button>
                  
                  {group.access_type === 'restricted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedGroupForAccess(group.id)}
                      className="gap-1"
                    >
                      <Users className="w-3 h-3" />
                      הרשאות
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(group.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    מחק
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Access Management Dialog */}
      <GroupAccessDialog
        groupId={selectedGroupForAccess}
        onClose={() => setSelectedGroupForAccess(null)}
        modules={modules || []}
        bundles={bundles || []}
      />
    </div>
  );
};

interface GroupAccessDialogProps {
  groupId: string | null;
  onClose: () => void;
  modules: Array<{ id: string; title: string }>;
  bundles: Array<{ id: string; title: string }>;
}

const GroupAccessDialog = ({ groupId, onClose, modules, bundles }: GroupAccessDialogProps) => {
  const { data: accessRules, isLoading } = useGroupAccess(groupId);
  const addAccess = useAddGroupAccess();
  const removeAccess = useRemoveGroupAccess();
  
  const [accessType, setAccessType] = useState<'module' | 'bundle'>('module');
  const [selectedId, setSelectedId] = useState<string>('');
  
  const handleAdd = async () => {
    if (!groupId || !selectedId) return;
    
    await addAccess.mutateAsync({
      group_id: groupId,
      module_id: accessType === 'module' ? selectedId : undefined,
      bundle_id: accessType === 'bundle' ? selectedId : undefined,
    });
    
    setSelectedId('');
  };
  
  const handleRemove = async (id: string) => {
    if (!groupId) return;
    await removeAccess.mutateAsync({ id, groupId });
  };
  
  return (
    <Dialog open={!!groupId} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול הרשאות גישה</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
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
              <SelectTrigger className="w-full sm:flex-1">
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
          ) : accessRules?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              אין הרשאות גישה מוגדרות
            </p>
          ) : (
            <div className="space-y-2">
              {accessRules?.map((rule) => (
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

export default DiscussionsPage;
