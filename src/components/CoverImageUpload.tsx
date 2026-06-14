import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET = "user_avatars";

interface CoverImageUploadProps {
  userId: string;
  /** Called with the new public URL after a successful upload. */
  onImageUpdate: (url: string) => void;
  className?: string;
}

/**
 * Compact "שנה רקע" trigger that uploads a wide cover/banner image to the
 * `user_avatars` bucket under `${userId}/cover-*` and persists it to
 * users.cover_image_url. Designed to be overlaid on the cover banner for the
 * self-view only.
 */
export const CoverImageUpload = ({
  userId,
  onImageUpdate,
  className,
}: CoverImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB (user_avatars bucket limit)

    if (!validTypes.includes(file.type)) {
      return "נא להעלות קובץ מסוג JPG, PNG או WEBP בלבד";
    }
    if (file.size > maxSize) {
      return "גודל הקובץ חייב להיות עד 5MB";
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    void handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${userId}/cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ cover_image_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onImageUpdate(publicUrl);
      toast.success("תמונת הרקע עודכנה בהצלחה");
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast.error("שגיאה בהעלאת תמונת הרקע");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "gap-2 bg-background/70 text-foreground backdrop-blur-sm hover:bg-background/90",
          className
        )}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">שנה רקע</span>
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};
