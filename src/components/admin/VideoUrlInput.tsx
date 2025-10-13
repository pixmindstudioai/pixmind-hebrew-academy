
import { useState, useEffect } from 'react';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LessonVideo } from '@/types/admin';
import { parseVideoUrl } from '@/lib/videoUtils';

interface VideoUrlInputProps {
  video?: LessonVideo;
  onChange: (video: LessonVideo | undefined) => void;
  disabled?: boolean;
}

const VideoUrlInput = ({ video, onChange, disabled }: VideoUrlInputProps) => {
  const [url, setUrl] = useState(video?.url || '');
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<LessonVideo | undefined>(video);

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

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">קישור וידאו</label>
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
        <p className="text-xs text-muted-foreground mt-1">
          תמיכה בקישורי YouTube, Vimeo, ו-mp4/webm. הקישור יומר אוטומטית לפורמט הטמעה.
        </p>
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>חשוב:</strong> עבור YouTube - הגדר את הוידאו כ-"Unlisted" והפעל "Allow embedding" בהגדרות הוידאו.
            עבור Vimeo - הגדר את "Who can embed" ל-"Anywhere" בהגדרות הפרטיות.
          </AlertDescription>
        </Alert>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview && (
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
