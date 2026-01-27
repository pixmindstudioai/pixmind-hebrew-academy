import { useState } from "react";
import { Download, Folder, FileText, ChevronDown, ChevronUp, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import {
  useFolderFiles,
  getFileDownloadUrl,
  getFileIcon,
  formatFileSize,
  MaterialsFolder,
} from "@/hooks/useMaterialsData";

// Hook to get all materials accessible to the current user
const useUserMaterials = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-materials", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const userEmail = user.email.toLowerCase();

      // Get user's module access
      const { data: moduleAccess } = await supabase
        .from("user_module_access")
        .select("module_id")
        .eq("user_email", userEmail);

      // Get user's bundle access
      const { data: bundleAccess } = await supabase
        .from("user_bundle_access")
        .select("bundle_id")
        .eq("user_email", userEmail);

      // Get modules from bundles
      let bundleModuleIds: string[] = [];
      if (bundleAccess && bundleAccess.length > 0) {
        const bundleIds = bundleAccess.map((b) => b.bundle_id);
        const { data: bundleModules } = await supabase
          .from("bundle_modules")
          .select("module_id")
          .in("bundle_id", bundleIds);

        bundleModuleIds = bundleModules?.map((bm) => bm.module_id) || [];
      }

      const accessedModuleIds = [
        ...(moduleAccess?.map((a) => a.module_id) || []),
        ...bundleModuleIds,
      ];

      const accessedBundleIds = bundleAccess?.map((b) => b.bundle_id) || [];

      if (accessedModuleIds.length === 0 && accessedBundleIds.length === 0) {
        return [];
      }

      // Get folder access records for user's modules and bundles
      let folderIds: string[] = [];

      if (accessedModuleIds.length > 0) {
        const { data: moduleFolderAccess } = await supabase
          .from("materials_folder_access")
          .select("folder_id")
          .in("module_id", accessedModuleIds);

        folderIds = [...folderIds, ...(moduleFolderAccess?.map((a) => a.folder_id) || [])];
      }

      if (accessedBundleIds.length > 0) {
        const { data: bundleFolderAccess } = await supabase
          .from("materials_folder_access")
          .select("folder_id")
          .in("bundle_id", accessedBundleIds);

        folderIds = [...folderIds, ...(bundleFolderAccess?.map((a) => a.folder_id) || [])];
      }

      const uniqueFolderIds = [...new Set(folderIds)];

      if (uniqueFolderIds.length === 0) return [];

      // Get active folders
      const { data: folders, error } = await supabase
        .from("materials_folders")
        .select("*")
        .in("id", uniqueFolderIds)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return folders as MaterialsFolder[];
    },
    enabled: !!user?.email,
  });
};

const FolderItem = ({ folder }: { folder: MaterialsFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const { data: files = [], isLoading } = useFolderFiles(isOpen ? folder.id : null);

  const handleDownload = async (file: { id: string; file_url: string; file_name: string }) => {
    setDownloadingFile(file.id);
    try {
      const url = await getFileDownloadUrl(file.file_url);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = file.file_name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error("שגיאה בהורדת הקובץ");
      }
    } catch (error) {
      toast.error("שגיאה בהורדת הקובץ");
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-primary" />
            <div>
              <h4 className="font-medium">{folder.title}</h4>
              {folder.description && (
                <p className="text-sm text-muted-foreground">{folder.description}</p>
              )}
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 mr-6 border-r pr-4 py-2 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">אין קבצים בתיקייה זו</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getFileIcon(file.file_type)}</span>
                  <div>
                    <p className="font-medium text-sm">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFile === file.id}
                >
                  {downloadingFile === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Materials = () => {
  const { data: folders = [], isLoading, error } = useUserMaterials();

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8">
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <FolderOpen className="w-12 h-12 text-destructive" />
                <p>שגיאה בטעינת חומרי הלימוד</p>
                <Button onClick={() => window.location.reload()}>נסה שוב</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">חומרי לימוד</h1>
            </div>
            <p className="text-muted-foreground">
              כאן תמצא את כל חומרי הלימוד והקבצים הזמינים עבורך
            </p>
          </div>

          {/* No Materials State */}
          {folders.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Folder className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">אין חומרי לימוד זמינים</h3>
                <p className="text-muted-foreground">
                  חומרי לימוד יופיעו כאן כשתירשם לקורסים
                </p>
              </CardContent>
            </Card>
          )}

          {/* Materials List */}
          {folders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  תיקיות זמינות ({folders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {folders.map((folder) => (
                    <FolderItem key={folder.id} folder={folder} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Materials;
