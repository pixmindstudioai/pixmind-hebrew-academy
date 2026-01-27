import { Video, FileText, Trash2, MessageSquare, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { NotebookEntry, useDeleteNotebookEntry } from '@/hooks/useNotebookData';

interface NotebookEntryListProps {
  entries: NotebookEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: NotebookEntry) => void;
  notebookId: string;
  isLoading?: boolean;
}

export default function NotebookEntryList({
  entries,
  selectedEntryId,
  onSelectEntry,
  notebookId,
  isLoading
}: NotebookEntryListProps) {
  const deleteEntry = useDeleteNotebookEntry();

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    await deleteEntry.mutateAsync({ id: entryId, notebookId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse">טוען רשומות...</div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">אין רשומות במחברת</p>
          <p className="text-sm">הוסף שיעורים מדפי השיעורים</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground mb-4">
          {entries.length} רשומות
        </h3>
        
        {entries.map(entry => (
          <div
            key={entry.id}
            onClick={() => onSelectEntry(entry)}
            className={cn(
              'group p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
              selectedEntryId === entry.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn(
                  'p-2 rounded-lg shrink-0',
                  entry.video_url ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                )}>
                  {entry.video_url ? (
                    <Video className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{entry.lesson_title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.created_at), 'dd בMMMM yyyy', { locale: he })}
                  </p>
                  
                  {entry.video_timestamp && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      זמן: {Math.floor(entry.video_timestamp / 60)}:{String(entry.video_timestamp % 60).padStart(2, '0')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(e, entry.id)}
                  disabled={deleteEntry.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">לחץ לפתיחת שיחה עם AI</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
