
import { useState, useRef } from 'react';
import { Play, ExternalLink, AlertCircle, Upload, Loader2, Film, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LessonVideo } from '@/types/admin';
import { parseVideoUrl } from '@/lib/videoUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoUrlInputProps {
  video?: LessonVideo;
  onChange: (video: LessonVideo | undefined) => void;
  disabled?: boolean;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const VideoUrlInput = ({ video, onChange, disabled }: VideoUrlInputProps) => {
  const [url, setUrl] = useState(video?.provider === 'file' ? '' : video?.url || '');
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<LessonVideo | undefined>(video);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndParseUrl = (inputUrl: string): LessonVideo | null => {
    if (!inputUrl.trim()) return null;

    const parsed = parseVideoUrl(inputUrl);
    if (!parsed) return null;

    // Return LessonVideo with embed URL
    return {
      provider: parsed.provider as 'youtube' | 'vimeo',
      url: parsed.embedUrl, // Store the embed URL
      videoId: parsed.videoId,
      startTime: parsed.startTime,
      thumbnail: parsed.thumbnail,
    };
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError('');

    if (!newUrl.trim()) {
      setPreview(undefined);
      onChange(undefined);
      return;
    }

    const parsed = validateAndParseUrl(newUrl);
    if (parsed) {
      setPreview(parsed);
      onChange(parsed);
      setError('');
    } else {
      setPreview(undefined);
      onChange(undefined);
      setError('כתובת וידאו לא תקינה. נא הזן קישור YouTube או Vimeo תקין.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setPreview(undefined);
    onChange(undefined);
    setError('');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error('ניתן להעלות רק קבצי וידאו מסוג MP4, WebM או MOV');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (500MB limit)
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('גודל הקובץ לא יכול לעבור 500MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError('');

    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson_videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lesson_videos')
        .getPublicUrl(path);

      const uploaded: LessonVideo = {
        provider: 'file',
        url: publicUrl,
        videoId: '',
        startTime: undefined,
        thumbnail: undefined,
      };

      setPreview(uploaded);
      onChange(uploaded);
      toast.success('הסרטון הועלה בהצלחה');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('שגיאה בהעלאת הסרטון. נסו שוב.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearFile = () => {
    setPreview(undefined);
    onChange(undefined);
    setError('');
  };

  return (
    <div className="space-y-4" dir="rtl">
      <label className="text-sm font-medium block">וידאו לשיעור</label>

      <Tabs defaultValue={video?.provider === 'file' ? 'upload' : 'url'} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" disabled={disabled}>קישור</TabsTrigger>
          <TabsTrigger value="upload" disabled={disabled}>העלאת קובץ</TabsTrigger>
        </TabsList>

        {/* URL tab — existing YouTube/Vimeo paste behavior */}
        <TabsContent value="url" className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="הדבק קישור YouTube או Vimeo..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={disabled}
              className={error ? 'border-destructive' : ''}
            />
            {url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                ניקוי
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            תמיכה בקישורי YouTube, Vimeo, ו-mp4/webm. הקישור יומר אוטומטית לפורמט הטמעה.
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>חשוב:</strong> עבור YouTube - הגדר את הוידאו כ-"Unlisted" והפעל "Allow embedding" בהגדרות הוידאו.
              עבור Vimeo - הגדר את "Who can embed" ל-"Anywhere" בהגדרות הפרטיות.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Upload tab — upload a video file to the lesson_videos bucket */}
        <TabsContent value="upload" className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="lesson-video-upload"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">מעלה סרטון...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">לחץ לבחירת קובץ וידאו</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM או MOV עד 500MB</p>
                </div>
              </>
            )}
          </button>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview for uploaded file */}
      {preview && preview.provider === 'file' && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            <span className="font-medium">תצוגה מקדימה</span>
            <Badge>קובץ</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFile}
              disabled={disabled || uploading}
              className="mr-auto h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
              הסר
            </Button>
          </div>
          <video src={preview.url} controls className="w-full rounded-lg" />
        </div>
      )}

      {/* Preview for YouTube/Vimeo */}
      {preview && preview.provider !== 'file' && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            <span className="font-medium">תצוגה מקדימה</span>
            <Badge>
              {preview.provider === 'youtube' ? 'YouTube' : 'Vimeo'}
            </Badge>
          </div>

          <div className="flex gap-4">
            {preview.thumbnail && (
              <div className="relative w-32 h-18 bg-muted rounded overflow-hidden flex-shrink-0">
                <img
                  src={preview.thumbnail}
                  alt="תמונה ממוזערת של הוידאו"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">מזהה וידאו: </span>
                <span className="font-mono">{preview.videoId}</span>
              </div>

              {preview.startTime && (
                <div className="text-sm">
                  <span className="text-muted-foreground">זמן התחלה: </span>
                  <span>{Math.floor(preview.startTime / 60)}:{(preview.startTime % 60).toString().padStart(2, '0')}</span>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a href={preview.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  פתיחה בחלון חדש
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUrlInput;
