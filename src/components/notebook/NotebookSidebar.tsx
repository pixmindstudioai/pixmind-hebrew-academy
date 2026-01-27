import { useState } from 'react';
import { Plus, FolderOpen, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Notebook,
  useCreateNotebook,
  useUpdateNotebook,
  useDeleteNotebook
} from '@/hooks/useNotebookData';

interface NotebookSidebarProps {
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  onSelectNotebook: (id: string) => void;
  isLoading?: boolean;
}

export default function NotebookSidebar({
  notebooks,
  selectedNotebookId,
  onSelectNotebook,
  isLoading
}: NotebookSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const createNotebook = useCreateNotebook();
  const updateNotebook = useUpdateNotebook();
  const deleteNotebook = useDeleteNotebook();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    try {
      const notebook = await createNotebook.mutateAsync(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
      onSelectNotebook(notebook.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingTitle.trim()) return;
    
    try {
      await updateNotebook.mutateAsync({ id, title: editingTitle.trim() });
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      await deleteNotebook.mutateAsync(deletingId);
      if (selectedNotebookId === deletingId && notebooks.length > 1) {
        const remaining = notebooks.find(n => n.id !== deletingId);
        if (remaining) onSelectNotebook(remaining.id);
      }
      setDeletingId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const startEditing = (notebook: Notebook) => {
    setEditingId(notebook.id);
    setEditingTitle(notebook.title);
  };

  return (
    <div className="h-full flex flex-col border-l bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">המחברות שלי</h2>
        
        {isCreating ? (
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="שם המחברת..."
              className="text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewTitle('');
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCreate}
              disabled={!newTitle.trim() || createNotebook.isPending}
            >
              {createNotebook.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewTitle('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4" />
            מחברת חדשה
          </Button>
        )}
      </div>

      {/* Notebooks List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notebooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>אין מחברות עדיין</p>
              <p className="text-xs">צור מחברת חדשה להתחלה</p>
            </div>
          ) : (
            notebooks.map(notebook => (
              <div
                key={notebook.id}
                className={cn(
                  'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                  selectedNotebookId === notebook.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
                onClick={() => {
                  if (editingId !== notebook.id) {
                    onSelectNotebook(notebook.id);
                  }
                }}
              >
                {editingId === notebook.id ? (
                  <>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(notebook.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingTitle('');
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdate(notebook.id);
                      }}
                      disabled={updateNotebook.isPending}
                    >
                      {updateNotebook.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                        setEditingTitle('');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate text-sm">{notebook.title}</span>
                    <div className="hidden group-hover:flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(notebook);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(notebook.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת מחברת</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את המחברת? פעולה זו תמחק גם את כל הרשומות והשיחות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNotebook.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'מחק'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
