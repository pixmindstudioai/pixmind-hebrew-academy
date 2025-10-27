import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, ExternalLink, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLessonProgress, useUpdateProgress } from "@/hooks/useContentData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EnhancedVideoPlayerProps {
  videoUrl?: string;
  title: string;
  lessonId: string;
  className?: string;
  onVideoEnd?: () => void;
  onNextLesson?: () => void;
  nextLessonTitle?: string;
}

// Function to convert regular YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  try {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      // Enhanced YouTube embed with full player controls
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=1`;
    }

    // Vimeo URL patterns
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      // Enhanced Vimeo embed with full player controls
      return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&controls=1&autoplay=1`;
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
  } catch (error) {
    console.error("Error parsing video URL:", error);
    return null;
  }
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

const EnhancedVideoPlayer = ({ 
  videoUrl, 
  title, 
  lessonId,
  className,
  onVideoEnd,
  onNextLesson,
  nextLessonTitle
}: EnhancedVideoPlayerProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5); // Countdown timer for auto-navigation
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get user progress for this lesson
  const { data: userProgress } = useLessonProgress(lessonId, user?.id);
  const { mutate: updateProgress } = useUpdateProgress();
  
  // Mark lesson as completed when video ends
  const markAsCompleted = () => {
    if (user?.id && !userProgress?.completed) {
      updateProgress({
        userId: user.id,
        lessonId: lessonId,
        completed: true
      }, {
        onSuccess: () => {
          toast.success('השיעור סומן כהושלם!');
        },
        onError: (error) => {
          console.error('Error updating progress:', error);
          toast.error('שגיאה בשמירת ההתקדמות');
        }
      });
    }
  };

  // Handle video end event
  const handleVideoEnd = () => {
    markAsCompleted();
    setShowNextButton(true);
    
    // Start countdown for auto-navigation if next lesson exists
    if (onNextLesson) {
      setTimeLeft(5);
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            onNextLesson();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  // Cancel auto-navigation
  const cancelNavigation = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setShowNextButton(false);
  };

  // Navigate to next lesson immediately
  const navigateToNext = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    if (onNextLesson) {
      onNextLesson();
    }
  };

  // Set up message listener for YouTube/Vimeo player events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // YouTube player events
      if (event.origin === 'https://www.youtube.com') {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'onStateChange' && data.info === 0) {
            // Video ended
            handleVideoEnd();
          }
        } catch (e) {
          // Not a YouTube event we care about
        }
      }
      
      // Vimeo player events
      if (event.origin === 'https://player.vimeo.com') {
        if (event.data?.event === 'ended') {
          // Video ended
          handleVideoEnd();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [lessonId, user?.id, userProgress?.completed, onNextLesson]);

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

  // For direct video files, use native video element with fallback to StandardCustomVideoPlayer
  if (provider === 'file') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={embedUrl}
          controls
          autoPlay
          className="w-full h-full object-contain"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onEnded={handleVideoEnd}
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
        
        {/* Next lesson button that appears when video ends */}
        {showNextButton && onNextLesson && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center space-y-4 p-6 bg-background/90 rounded-lg backdrop-blur-sm max-w-md">
              <h3 className="text-xl font-bold">הסרטון הסתיים</h3>
              <p className="text-muted-foreground">השיעור סומן כהושלם!</p>
              {nextLessonTitle && (
                <p className="text-sm">הבא: {nextLessonTitle}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button onClick={navigateToNext} className="flex items-center justify-center gap-2">
                  <SkipForward className="w-4 h-4" />
                  המשך לשיעור הבא ({timeLeft}s)
                </Button>
                <Button variant="outline" onClick={cancelNavigation}>
                  המשך לצפייה
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For YouTube/Vimeo, use iframe with enhanced controls
  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
      
      {/* Next lesson button that appears when video ends */}
      {showNextButton && onNextLesson && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center space-y-4 p-6 bg-background/90 rounded-lg backdrop-blur-sm max-w-md">
            <h3 className="text-xl font-bold">הסרטון הסתיים</h3>
            <p className="text-muted-foreground">השיעור סומן כהושלם!</p>
            {nextLessonTitle && (
              <p className="text-sm">הבא: {nextLessonTitle}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={navigateToNext} className="flex items-center justify-center gap-2">
                <SkipForward className="w-4 h-4" />
                המשך לשיעור הבא ({timeLeft}s)
              </Button>
              <Button variant="outline" onClick={cancelNavigation}>
                המשך לצפייה
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;