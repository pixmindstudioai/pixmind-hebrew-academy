import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { 
  useNotebooks, 
  useCreateNotebook,
  useCreateNotebookEntry,
  useGetOrCreateDefaultNotebook
} from '@/hooks/useNotebookData';
import { toast } from 'sonner';

interface AddToNotebookButtonProps {
  lessonId: string;
  lessonTitle: string;
  moduleId?: string;
  chapterId?: string;
  videoUrl?: string;
  videoTimestamp?: number;
  className?: string;
}

export default function AddToNotebookButton({
  lessonId,
  lessonTitle,
  moduleId,
  chapterId,
  videoUrl,
  videoTimestamp,
  className = ''
}: AddToNotebookButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('');
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const { data: notebooks = [], isLoading: notebooksLoading } = useNotebooks();
  const createNotebook = useCreateNotebook();
  const createEntry = useCreateNotebookEntry();
  const getOrCreateDefault = useGetOrCreateDefaultNotebook();

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error('יש להתחבר כדי להשתמש במחברת החכמה');
      return;
    }
    setIsOpen(true);
  };

  const handleQuickAdd = async () => {
    try {
      const notebook = await getOrCreateDefault.mutateAsync();
      
      await createEntry.mutateAsync({
        notebook_id: notebook.id,
        lesson_id: lessonId,
        module_id: moduleId,
        chapter_id: chapterId,
        lesson_title: lessonTitle,
        video_url: videoUrl,
        video_timestamp: videoTimestamp
      });
      
      setIsOpen(false);
      navigate('/notebook');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToSelected = async () => {
    if (!selectedNotebook) {
      toast.error('יש לבחור מחברת');
      return;
    }
    
    try {
      await createEntry.mutateAsync({
        notebook_id: selectedNotebook,
        lesson_id: lessonId,
        module_id: moduleId,
        chapter_id: chapterId,
        lesson_title: lessonTitle,
        video_url: videoUrl,
        video_timestamp: videoTimestamp
      });
      
      setIsOpen(false);
      navigate('/notebook');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newNotebookTitle.trim()) {
      toast.error('יש להזין שם למחברת');
      return;
    }
    
    try {
      const notebook = await createNotebook.mutateAsync(newNotebookTitle.trim());
      
      await createEntry.mutateAsync({
        notebook_id: notebook.id,
        lesson_id: lessonId,
        module_id: moduleId,
        chapter_id: chapterId,
        lesson_title: lessonTitle,
        video_url: videoUrl,
        video_timestamp: videoTimestamp
      });
      
      setIsOpen(false);
      setNewNotebookTitle('');
      setIsCreatingNew(false);
      navigate('/notebook');
    } catch (error) {
      console.error(error);
    }
  };

  const isProcessing = createEntry.isPending || createNotebook.isPending || getOrCreateDefault.isPending;

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className={`gap-2 ${className}`}
        disabled={!isAuthenticated}
      >
        <BookOpen className="w-4 h-4" />
        הוספה למחברת החכמה
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">הוספה למחברת החכמה</DialogTitle>
            <DialogDescription className="text-right">
              בחר מחברת להוספת השיעור "{lessonTitle}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick add to default */}
            {notebooks.length === 0 && (
              <Button 
                onClick={handleQuickAdd} 
                className="w-full gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                צור מחברת והוסף את השיעור
              </Button>
            )}

            {/* Existing notebooks selection */}
            {notebooks.length > 0 && !isCreatingNew && (
              <>
                <div className="space-y-2">
                  <Label>בחר מחברת קיימת</Label>
                  <Select 
                    value={selectedNotebook} 
                    onValueChange={setSelectedNotebook}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מחברת..." />
                    </SelectTrigger>
                    <SelectContent>
                      {notebooks.map(notebook => (
                        <SelectItem key={notebook.id} value={notebook.id}>
                          {notebook.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAddToSelected}
                  className="w-full gap-2"
                  disabled={!selectedNotebook || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  הוסף למחברת
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">או</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  צור מחברת חדשה
                </Button>
              </>
            )}

            {/* Create new notebook */}
            {(notebooks.length > 0 && isCreatingNew) && (
              <>
                <div className="space-y-2">
                  <Label>שם המחברת החדשה</Label>
                  <Input
                    value={newNotebookTitle}
                    onChange={(e) => setNewNotebookTitle(e.target.value)}
                    placeholder="הזן שם למחברת..."
                    className="text-right"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewNotebookTitle('');
                    }}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleCreateAndAdd}
                    className="flex-1 gap-2"
                    disabled={!newNotebookTitle.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    צור והוסף
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
