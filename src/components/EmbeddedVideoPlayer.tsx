import { useState } from "react";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmbeddedVideoPlayerProps {
  videoUrl?: string;
  title: string;
  className?: string;
}

// Function to convert regular YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // YouTube URL patterns
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const youtubeMatch = url.match(youtubeRegex);
  
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  }

  // Vimeo URL patterns
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
  }

  // If already an embed URL, return as is
  if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
    return url;
  }

  // For direct video files (.mp4, .webm, etc.)
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return url;
  }

  return null;
};

// Function to detect video provider
const getVideoProvider = (url: string): 'youtube' | 'vimeo' | 'file' | 'unknown' => {
  if (!url) return 'unknown';
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return 'file';
  }
  
  return 'unknown';
};

const EmbeddedVideoPlayer = ({ videoUrl, title, className }: EmbeddedVideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!videoUrl) {
    return (
      <div className={cn("w-full aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">לא נמצא סרטון לשיעור זה</p>
        </div>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl);
  const provider = getVideoProvider(videoUrl);

  if (!embedUrl || provider === 'unknown') {
    return (
      <div className={cn("w-full aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>פורמט הסרטון אינו נתמך</p>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  פתח בחלון חדש
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // For direct video files, use native video element
  if (provider === 'file') {
    return (
      <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
        <video
          src={embedUrl}
          controls
          className="w-full h-full object-contain"
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          aria-label={title}
        >
          הדפדפן שלך אינו תומך בתגית וידאו.
        </video>
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
              <p className="text-white text-sm">טוען סרטון...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For YouTube/Vimeo, use iframe
  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
            <p className="text-white text-sm">טוען סרטון...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Alert className="max-w-md bg-black/80 border-red-500">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-white">
              <div className="space-y-2">
                <p>שגיאה בטעינת הסרטון</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    פתח בחלון חדש
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default EmbeddedVideoPlayer;