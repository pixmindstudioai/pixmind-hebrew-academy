import { useState, useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl: string | null;
  userName: string;
  onImageUpdate: (url: string | null) => void;
}

export const ProfileImageUpload = ({ 
  userId, 
  currentImageUrl, 
  userName,
  onImageUpdate 
}: ProfileImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return 'נא להעלות קובץ מסוג JPG, PNG או WEBP בלבד';
    }

    if (file.size > maxSize) {
      return 'גודל הקובץ חייב להיות עד 5MB';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Delete old image if exists
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('user_avatars')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user_avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user_avatars')
        .getPublicUrl(filePath);

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onImageUpdate(publicUrl);
      setPreviewUrl(null);
      toast.success('תמונת הפרופיל עודכנה בהצלחה');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('שגיאה בהעלאת התמונה');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    setIsUploading(true);

    try {
      // Delete from storage
      const path = currentImageUrl.split('/').pop();
      if (path) {
        await supabase.storage
          .from('user_avatars')
          .remove([`${userId}/${path}`]);
      }

      // Update user record
      const { error } = await supabase
        .from('users')
        .update({ profile_picture_url: null })
        .eq('id', userId);

      if (error) throw error;

      onImageUpdate(null);
      toast.success('תמונת הפרופיל הוסרה');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error('שגיאה בהסרת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={previewUrl || currentImageUrl || undefined} />
          <AvatarFallback className="text-4xl">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 ml-2" />
          {currentImageUrl ? 'שנה תמונה' : 'העלה תמונה'}
        </Button>

        {currentImageUrl && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            הסר תמונה
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        קבצים מותרים: JPG, PNG, WEBP (עד 5MB)
      </p>
    </div>
  );
};
