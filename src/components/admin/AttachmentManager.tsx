
import { useState } from 'react';
import { 
  Upload, 
  File, 
  Trash2, 
  Download,
  FileText,
  Image,
  Video,
  Archive,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LessonAttachment } from '@/types/admin';

interface AttachmentManagerProps {
  attachments: LessonAttachment[];
  onAdd: (file: File) => void;
  onRemove: (attachmentId: string) => void;
  isLoading?: boolean;
}

const AttachmentManager = ({ attachments, onAdd, onRemove, isLoading }: AttachmentManagerProps) => {
  const [dragActive, setDragActive] = useState(false);

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return Image;
    if (mime.startsWith('video/')) return Video;
    if (mime.includes('pdf')) return FileText;
    if (mime.includes('zip') || mime.includes('rar')) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onAdd(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAdd(file);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">קבצים מצורפים</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              הוספת קובץ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>העלאת קובץ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  תמיכה בקבצי PDF, תמונות, וידאו וארכיונים
                </p>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.zip,.rar"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isLoading}
                >
                  בחירת קובץ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length > 0 ? (
        <div className="grid gap-3">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.mime);
            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{attachment.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.size)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {attachment.mime.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" asChild>
                    <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onRemove(attachment.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>לא הועלו קבצים עדיין</p>
          <p className="text-xs">השתמש בכפתור "הוספת קובץ" להעלאת קבצים</p>
        </div>
      )}
    </div>
  );
};

export default AttachmentManager;
