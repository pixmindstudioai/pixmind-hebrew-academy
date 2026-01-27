import { useState } from "react";
import { Download, Folder, FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  useModuleMaterials,
  useFolderFiles,
  getFileDownloadUrl,
  getFileIcon,
  formatFileSize,
  MaterialsFolder,
} from "@/hooks/useMaterialsData";

interface CourseMaterialsSectionProps {
  moduleId: string;
}

const FolderItem = ({ folder }: { folder: MaterialsFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const { data: files = [], isLoading } = useFolderFiles(isOpen ? folder.id : null);

  const handleDownload = async (file: { id: string; file_url: string; file_name: string }) => {
    setDownloadingFile(file.id);
    try {
      const url = await getFileDownloadUrl(file.file_url);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.file_name;
        link.target = '_blank';
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

const CourseMaterialsSection = ({ moduleId }: CourseMaterialsSectionProps) => {
  const { data: folders = [], isLoading } = useModuleMaterials(moduleId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            חומרי לימוד
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (folders.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          חומרי לימוד
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
  );
};

export default CourseMaterialsSection;
