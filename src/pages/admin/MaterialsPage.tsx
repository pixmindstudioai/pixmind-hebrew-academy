import { useState } from "react";
import { Plus, Folder, FileText, Settings, Trash2, Edit, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useAdminMaterialsFolders,
  useAdminMaterialsFiles,
  useFolderAccess,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useUploadMaterialFile,
  useDeleteMaterialFile,
  useSetFolderAccess,
  getFileIcon,
  formatFileSize,
  MaterialsFolder,
} from "@/hooks/useMaterialsData";
import { useModules } from "@/hooks/useContentData";
import { useBundles } from "@/hooks/useBundlesData";

const MaterialsPage = () => {
  const [selectedFolder, setSelectedFolder] = useState<MaterialsFolder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<string[]>([]);

  const { data: folders = [], isLoading: foldersLoading } = useAdminMaterialsFolders();
  const { data: files = [], isLoading: filesLoading } = useAdminMaterialsFiles(selectedFolder?.id || null);
  const { data: folderAccess = [] } = useFolderAccess(selectedFolder?.id || null);
  const { data: modules = [] } = useModules('active');
  const { data: bundles = [] } = useBundles();

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const uploadFile = useUploadMaterialFile();
  const deleteFile = useDeleteMaterialFile();
  const setFolderAccess = useSetFolderAccess();

  const handleCreateFolder = async () => {
    if (!newFolderTitle.trim()) {
      toast.error("נא להזין שם לתיקייה");
      return;
    }

    await createFolder.mutateAsync({
      title: newFolderTitle,
      description: newFolderDescription || undefined,
    });

    setIsCreateFolderOpen(false);
    setNewFolderTitle("");
    setNewFolderDescription("");
  };

  const handleEditFolder = async () => {
    if (!selectedFolder || !editTitle.trim()) return;

    await updateFolder.mutateAsync({
      id: selectedFolder.id,
      title: editTitle,
      description: editDescription || null,
    });

    setIsEditFolderOpen(false);
  };

  const handleToggleActive = async (folder: MaterialsFolder) => {
    await updateFolder.mutateAsync({
      id: folder.id,
      is_active: !folder.is_active,
    });
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    await deleteFolder.mutateAsync(folderToDelete);

    if (selectedFolder?.id === folderToDelete) {
      setSelectedFolder(null);
    }
    
    setIsDeleteDialogOpen(false);
    setFolderToDelete(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder || !e.target.files?.length) return;

    const file = e.target.files[0];
    await uploadFile.mutateAsync({ folderId: selectedFolder.id, file });
    
    e.target.value = "";
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    if (!selectedFolder) return;
    
    await deleteFile.mutateAsync({
      id: fileId,
      fileUrl,
      folderId: selectedFolder.id,
    });
  };

  const openAccessDialog = () => {
    if (!selectedFolder) return;
    
    const moduleIds = folderAccess.filter(a => a.module_id).map(a => a.module_id!);
    const bundleIds = folderAccess.filter(a => a.bundle_id).map(a => a.bundle_id!);
    
    setSelectedModules(moduleIds);
    setSelectedBundles(bundleIds);
    setIsAccessDialogOpen(true);
  };

  const handleSaveAccess = async () => {
    if (!selectedFolder) return;

    await setFolderAccess.mutateAsync({
      folderId: selectedFolder.id,
      moduleIds: selectedModules,
      bundleIds: selectedBundles,
    });

    setIsAccessDialogOpen(false);
  };

  const openEditDialog = (folder: MaterialsFolder) => {
    setSelectedFolder(folder);
    setEditTitle(folder.title);
    setEditDescription(folder.description || "");
    setIsEditFolderOpen(true);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">חומרי לימוד</h1>
          <p className="text-muted-foreground">ניהול תיקיות וקבצים לקורסים</p>
        </div>
        <Button onClick={() => setIsCreateFolderOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          תיקייה חדשה
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              תיקיות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {foldersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : folders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                אין תיקיות עדיין
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFolder?.id === folder.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-primary" />
                          <span className="font-medium">{folder.title}</span>
                        </div>
                        <Badge variant={folder.is_active ? "default" : "secondary"}>
                          {folder.is_active ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </div>
                      {folder.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Folder Details & Files */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedFolder ? selectedFolder.title : "בחר תיקייה"}
              </CardTitle>
              {selectedFolder && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(selectedFolder)}
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    עריכה
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openAccessDialog}
                  >
                    <Settings className="w-4 h-4 ml-1" />
                    הרשאות
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(selectedFolder)}
                  >
                    {selectedFolder.is_active ? "השבת" : "הפעל"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setFolderToDelete(selectedFolder.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedFolder ? (
              <div className="text-center py-12 text-muted-foreground">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>בחר תיקייה מהרשימה כדי לצפות בקבצים</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload Section */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>העלאת קובץ</span>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadFile.isPending}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.webp"
                    />
                  </Label>
                  {uploadFile.isPending && (
                    <span className="text-sm text-muted-foreground">מעלה...</span>
                  )}
                </div>

                <Separator />

                {/* Files List */}
                {filesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    אין קבצים בתיקייה זו
                  </p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                          <div>
                            <p className="font-medium">{file.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFile(file.id, file.file_url)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current Access Info */}
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">הרשאות נוכחיות:</h4>
                  <div className="flex flex-wrap gap-2">
                    {folderAccess.length === 0 ? (
                      <span className="text-muted-foreground text-sm">
                        לא הוגדרו הרשאות - התיקייה לא נגישה למשתמשים
                      </span>
                    ) : (
                      <>
                        {folderAccess.filter(a => a.module_id).map(access => {
                          const module = modules.find(m => m.id === access.module_id);
                          return (
                            <Badge key={access.id} variant="outline">
                              קורס: {module?.title || "לא ידוע"}
                            </Badge>
                          );
                        })}
                        {folderAccess.filter(a => a.bundle_id).map(access => {
                          const bundle = bundles.find(b => b.id === access.bundle_id);
                          return (
                            <Badge key={access.id} variant="secondary">
                              חבילה: {bundle?.title || "לא ידוע"}
                            </Badge>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-title">שם התיקייה</Label>
              <Input
                id="folder-title"
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                placeholder="הזן שם לתיקייה"
              />
            </div>
            <div>
              <Label htmlFor="folder-description">תיאור (אופציונלי)</Label>
              <Textarea
                id="folder-description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="תיאור קצר של התיקייה"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateFolder} disabled={createFolder.isPending}>
              {createFolder.isPending ? "יוצר..." : "צור תיקייה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת תיקייה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">שם התיקייה</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">תיאור</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFolderOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEditFolder} disabled={updateFolder.isPending}>
              {updateFolder.isPending ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>הרשאות גישה לתיקייה</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">קורסים</h4>
              <ScrollArea className="h-[150px] border rounded-lg p-3">
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedModules([...selectedModules, module.id]);
                          } else {
                            setSelectedModules(selectedModules.filter(id => id !== module.id));
                          }
                        }}
                      />
                      <Label htmlFor={`module-${module.id}`} className="cursor-pointer">
                        {module.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div>
              <h4 className="font-medium mb-3">חבילות</h4>
              <ScrollArea className="h-[150px] border rounded-lg p-3">
                <div className="space-y-2">
                  {bundles.map((bundle) => (
                    <div key={bundle.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`bundle-${bundle.id}`}
                        checked={selectedBundles.includes(bundle.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBundles([...selectedBundles, bundle.id]);
                          } else {
                            setSelectedBundles(selectedBundles.filter(id => id !== bundle.id));
                          }
                        }}
                      />
                      <Label htmlFor={`bundle-${bundle.id}`} className="cursor-pointer">
                        {bundle.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveAccess} disabled={setFolderAccess.isPending}>
              {setFolderAccess.isPending ? "שומר..." : "שמור הרשאות"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את התיקייה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את התיקייה וכל הקבצים בה. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MaterialsPage;
