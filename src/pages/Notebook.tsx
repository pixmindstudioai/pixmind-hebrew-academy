import { useState, useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import NotebookSidebar from '@/components/notebook/NotebookSidebar';
import NotebookEntryList from '@/components/notebook/NotebookEntryList';
import NotebookConversation from '@/components/notebook/NotebookConversation';
import { useNotebooks, useNotebookEntries, NotebookEntry } from '@/hooks/useNotebookData';
import { useLesson } from '@/hooks/useContentData';

const NotebookPage = () => {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const { data: notebooks = [], isLoading: notebooksLoading } = useNotebooks();
  const { data: entries = [], isLoading: entriesLoading } = useNotebookEntries(selectedNotebookId || '');
  
  // Get lesson details for conversation context
  const { data: lessonDetails } = useLesson(selectedEntry?.lesson_id || '');

  // Auto-select first notebook
  useEffect(() => {
    if (notebooks.length > 0 && !selectedNotebookId) {
      setSelectedNotebookId(notebooks[0].id);
    }
  }, [notebooks, selectedNotebookId]);

  // Reset selected entry when notebook changes
  useEffect(() => {
    setSelectedEntry(null);
  }, [selectedNotebookId]);

  const handleSelectNotebook = (id: string) => {
    setSelectedNotebookId(id);
    setSelectedEntry(null);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectEntry = (entry: NotebookEntry) => {
    setSelectedEntry(entry);
  };

  const handleBackFromConversation = () => {
    setSelectedEntry(null);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">המחברת החכמה</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <div className="flex h-[calc(100svh-73px)]">
            {/* Sidebar - Notebooks List */}
            <div className="hidden md:block w-64 shrink-0">
              <NotebookSidebar
                notebooks={notebooks}
                selectedNotebookId={selectedNotebookId}
                onSelectNotebook={handleSelectNotebook}
                isLoading={notebooksLoading}
              />
            </div>

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden fixed bottom-20 right-4 z-30">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
              >
                <BookOpen className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
              <div className="md:hidden fixed inset-0 z-40">
                <div 
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
                <div className="absolute right-0 top-0 h-full w-[85vw] max-w-xs bg-background">
                  <NotebookSidebar
                    notebooks={notebooks}
                    selectedNotebookId={selectedNotebookId}
                    onSelectNotebook={handleSelectNotebook}
                    isLoading={notebooksLoading}
                  />
                </div>
              </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex min-w-0">
              {notebooksLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-muted-foreground">טוען מחברות...</p>
                  </div>
                </div>
              ) : notebooks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md px-4">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                    <h2 className="text-xl font-semibold mb-2">המחברת החכמה שלך ריקה</h2>
                    <p className="text-muted-foreground mb-4">
                      היכנס לשיעור כלשהו ולחץ על "הוספה למחברת החכמה" כדי לשמור שיעורים שברצונך להבין יותר לעומק
                    </p>
                  </div>
                </div>
              ) : selectedEntry ? (
                <div className="flex-1">
                  <NotebookConversation
                    entry={selectedEntry}
                    lessonDescription={lessonDetails?.description}
                    onBack={handleBackFromConversation}
                  />
                </div>
              ) : (
                <div className="flex-1 border-l">
                  <NotebookEntryList
                    entries={entries}
                    selectedEntryId={selectedEntry?.id || null}
                    onSelectEntry={handleSelectEntry}
                    notebookId={selectedNotebookId || ''}
                    isLoading={entriesLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default NotebookPage;
