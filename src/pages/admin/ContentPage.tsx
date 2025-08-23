
import { useState } from 'react';
import { Plus, BookOpen, List, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModuleForm from '@/components/admin/ModuleForm';
import { AdminModule } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const ContentPage = () => {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModule | undefined>();
  const { toast } = useToast();

  const handleCreateModule = (data: any) => {
    const newModule: AdminModule = {
      id: `module-${Date.now()}`,
      title: data.title,
      description: data.description,
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: data.isPublished,
    };

    setModules(prev => [...prev, newModule]);
    setShowModuleForm(false);
    toast({
      title: "מודול נוצר בהצלחה",
      description: `המודול "${data.title}" נוצר ונשמר במערכת`,
    });
  };

  const handleEditModule = (data: any) => {
    if (!editingModule) return;

    setModules(prev => prev.map(module => 
      module.id === editingModule.id
        ? {
            ...module,
            title: data.title,
            description: data.description,
            isPublished: data.isPublished,
            updatedAt: new Date(),
          }
        : module
    ));

    setEditingModule(undefined);
    setShowModuleForm(false);
    toast({
      title: "מודול עודכן בהצלחה",
      description: `המודול "${data.title}" עודכן במערכת`,
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
    toast({
      title: "מודול נמחק",
      description: "המודול נמחק מהמערכת",
    });
  };

  if (showModuleForm) {
    return (
      <ModuleForm
        module={editingModule}
        onSubmit={editingModule ? handleEditModule : handleCreateModule}
        onCancel={() => {
          setShowModuleForm(false);
          setEditingModule(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול תוכן</h2>
          <p className="text-muted-foreground">
            יצירה ועריכה של מודולים, פרקים ושיעורים
          </p>
        </div>
        <Button onClick={() => setShowModuleForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          מודול חדש
        </Button>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules" className="gap-2">
            <BookOpen className="w-4 h-4" />
            מודולים
          </TabsTrigger>
          <TabsTrigger value="chapters" className="gap-2">
            <List className="w-4 h-4" />
            פרקים
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <Play className="w-4 h-4" />
            שיעורים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          {modules.length > 0 ? (
            <div className="grid gap-4">
              {modules.map((module) => (
                <div key={module.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{module.title}</h3>
                      <p className="text-muted-foreground">{module.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{module.chapters.length} פרקים</span>
                        <span>
                          {module.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)} שיעורים
                        </span>
                        <span className={module.isPublished ? 'text-green-600' : 'text-orange-600'}>
                          {module.isPublished ? 'פורסם' : 'טיוטה'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingModule(module);
                          setShowModuleForm(true);
                        }}
                      >
                        עריכה
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteModule(module.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        מחיקה
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">לא נוצרו מודולים עדיין</p>
              <p>התחל ביצירת המודול הראשון שלך</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>ניהול פרקים יהיה זמין בקרוב</p>
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>ניהול שיעורים יהיה זמין בקרוב</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentPage;
