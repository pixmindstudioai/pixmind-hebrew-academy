import { useState, useRef } from 'react';
import { Upload, Image, Loader2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ThumbnailUploaderProps {
  thumbnailUrl?: string;
  onThumbnailChange: (url: string) => void;
  disabled?: boolean;
  entityType: 'module' | 'lesson';
  entityId?: string;
}

const ThumbnailUploader = ({ 
  thumbnailUrl, 
  onThumbnailChange, 
  disabled = false,
  entityType,
  entityId
}: ThumbnailUploaderProps) => {
  const [urlInput, setUrlInput] = useState(thumbnailUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && /\.(jpg|jpeg|png|webp|svg)$/i.test(urlObj.pathname);
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      onThumbnailChange('');
      return;
    }

    if (!validateImageUrl(urlInput)) {
      toast.error('יש להזין URL של תמונה תקין (https, jpg/png/webp/svg)');
      return;
    }

    onThumbnailChange(urlInput);
    toast.success('כתובת התמונה נשמרה');
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('יש להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('גודל הקובץ לא יכול לעלות על 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityType}-${entityId || Date.now()}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(data.path);

      onThumbnailChange(publicUrl);
      setUrlInput(publicUrl);
      toast.success('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת התמונה. נסה שוב.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearThumbnail = () => {
    onThumbnailChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">תמונת תאמבנייל</Label>
      
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">הדבק URL</TabsTrigger>
          <TabsTrigger value="upload">העלה תמונה</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-3">
          <div className="flex space-x-2 space-x-reverse">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Button 
              onClick={handleUrlSubmit}
              disabled={disabled}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4" />
              שמור
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            הזן קישור HTTPS לתמונה (JPG, PNG, WebP, SVG)
          </p>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              variant="outline"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  בחר תמונה להעלאה
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            גודל מקסימלי: 2MB. פורמטים נתמכים: JPG, PNG, WebP, SVG
          </p>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {thumbnailUrl && (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="aspect-video bg-muted">
              <img
                src={thumbnailUrl}
                alt="תצוגה מקדימה של התאמבנייל"
                className="w-full h-full object-cover rounded-md"
                onError={() => {
                  toast.error('לא ניתן לטעון את התמונה');
                  clearThumbnail();
                }}
              />
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={clearThumbnail}
              className="absolute top-2 left-2"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Placeholder when no thumbnail */}
      {!thumbnailUrl && (
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">אין תמונת תאמבנייל</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ThumbnailUploader;