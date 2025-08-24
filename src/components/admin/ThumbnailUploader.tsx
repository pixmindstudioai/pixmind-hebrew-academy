import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ThumbnailUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
}

const ThumbnailUploader = ({ 
  value, 
  onChange, 
  disabled = false,
  label = "תמונת ת׳אמבנייל" 
}: ThumbnailUploaderProps) => {
  const [urlInput, setUrlInput] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageUrl = (url: string) => {
    if (!url.startsWith('https://')) {
      toast.error('הכתובת חייבת להתחיל ב-https://');
      return false;
    }
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(`.${ext}`)
    );
    
    if (!hasImageExtension) {
      toast.error('הקובץ חייב להיות תמונה (jpg, png, webp, gif, svg)');
      return false;
    }
    
    return true;
  };

  const handleUrlSubmit = () => {
    if (urlInput && validateImageUrl(urlInput)) {
      onChange(urlInput);
      toast.success('תמונה נוספה בהצלחה');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('ניתן להעלות רק קבצי תמונה');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('גודל הקובץ לא יכול לעבור 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(data.path);

      onChange(publicUrl);
      toast.success('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת התמונה. נסו שוב.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    toast.success('התמונה הוסרה');
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">{label}</Label>
      
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" disabled={disabled}>קישור לתמונה</TabsTrigger>
          <TabsTrigger value="upload" disabled={disabled}>העלאת קובץ</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Button 
              type="button"
              onClick={handleUrlSubmit}
              disabled={disabled || !urlInput}
              variant="outline"
            >
              <LinkIcon className="w-4 h-4" />
              הוסף
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={disabled || uploading}
              className="hidden"
              id="thumbnail-upload"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              variant="outline"
              className="flex-1"
            >
              <Upload className="w-4 h-4 ml-2" />
              {uploading ? 'מעלה...' : 'בחר קובץ'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            קבצי תמונה בלבד, עד 2MB (JPG, PNG, WebP, GIF, SVG)
          </p>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {value && (
        <div className="space-y-2">
          <div className="relative aspect-video w-full max-w-md bg-muted rounded-lg overflow-hidden border">
            <img
              src={value}
              alt="תצוגה מקדימה"
              className="w-full h-full object-cover"
              onError={() => toast.error('שגיאה בטעינת התמונה')}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">תצוגה מקדימה (יחס 16:9)</p>
        </div>
      )}

      {/* Placeholder when no image */}
      {!value && (
        <div className="aspect-video w-full max-w-md bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Image className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">אין תמונה</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailUploader;