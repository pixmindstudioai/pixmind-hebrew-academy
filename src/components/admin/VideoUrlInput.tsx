
import { useState, useEffect } from 'react';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LessonVideo } from '@/types/admin';

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

    // YouTube patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ];

    // Vimeo patterns
    const vimeoPatterns = [
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([0-9]+)/,
      /(?:https?:\/\/)?player\.vimeo\.com\/video\/([0-9]+)/,
    ];

    // Check YouTube
    for (const pattern of youtubePatterns) {
      const match = inputUrl.match(pattern);
      if (match) {
        const videoId = match[1];
        // Extract start time if present (t=123s or start=123)
        const timeMatch = inputUrl.match(/[?&](?:t|start)=(\d+)/);
        const startTime = timeMatch ? parseInt(timeMatch[1]) : undefined;
        
        return {
          provider: 'youtube',
          url: inputUrl,
          videoId,
          startTime,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        };
      }
    }

    // Check Vimeo
    for (const pattern of vimeoPatterns) {
      const match = inputUrl.match(pattern);
      if (match) {
        const videoId = match[1];
        return {
          provider: 'vimeo',
          url: inputUrl,
          videoId,
          thumbnail: `https://vumbnail.com/${videoId}.jpg`,
        };
      }
    }

    return null;
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
          תמיכה בקישורי YouTube ו-Vimeo בלבד
        </p>
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
