import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2,
  AlertCircle, ExternalLink, RotateCcw, RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AcademyVideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}

const SPEEDS = ["0.5", "0.75", "1", "1.25", "1.5", "2"];

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/**
 * Academy-styled custom video player for uploaded (direct-file) videos.
 * Built on a native <video> element (no react-player dependency) with
 * cyan/dark branded chrome: big play button, seek + volume sliders,
 * speed control, ±10s skip, fullscreen, keyboard shortcuts, auto-hide.
 */
const AcademyVideoPlayer = ({ src, title, poster, autoPlay, className, onEnded }: AcademyVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [rate, setRate] = useState("1");
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const onVolume = (val: number[]) => {
    const v = videoRef.current;
    if (!v) return;
    const nv = val[0] / 100;
    v.volume = nv;
    v.muted = nv === 0;
    setVolume(nv);
    setMuted(nv === 0);
  };

  const onSeek = (val: number[]) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = val[0];
    setCurrent(val[0]);
  };

  const onRate = (val: string) => {
    setRate(val);
    if (videoRef.current) videoRef.current.playbackRate = parseFloat(val);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // auto-hide controls while playing
  const nudgeControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 2800);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // keyboard shortcuts (only when this player has focus/hover)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && !containerRef.current?.matches(":hover")) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); seekBy(5); break;
        case "ArrowLeft": e.preventDefault(); seekBy(-5); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, toggleMute, toggleFullscreen]);

  if (hasError) {
    return (
      <div className={cn("flex aspect-video w-full items-center justify-center rounded-xl bg-muted p-6", className)}>
        <div className="space-y-3 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">שגיאה בטעינת הסרטון</p>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              פתיחה בחלון חדש
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      dir="ltr"
      tabIndex={0}
      className={cn(
        "group relative w-full overflow-hidden bg-black outline-none",
        // In fullscreen the container fills the whole screen (no rounded corners
        // or ring) and vertically centers the video; otherwise it keeps the
        // 16:9 framed, rounded, branded look.
        isFullscreen
          ? "flex h-screen items-center justify-center rounded-none ring-0"
          : "rounded-xl ring-1 ring-primary/20",
        className
      )}
      onMouseMove={nudgeControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Fullscreen: fill the screen height so the video uses all available
          space and stays centered. Windowed: lock to a 16:9 box. */}
      <div className={cn("relative w-full", isFullscreen ? "h-full" : "aspect-video")}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          playsInline
          className="h-full w-full bg-black object-contain"
          aria-label={title}
          onClick={togglePlay}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onProgress={(e) => {
            const v = e.currentTarget;
            if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onPlay={() => { setIsPlaying(true); nudgeControls(); }}
          onPause={() => { setIsPlaying(false); setShowControls(true); }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onEnded={() => { setIsPlaying(false); setShowControls(true); onEnded?.(); }}
          onError={() => { setIsLoading(false); setHasError(true); }}
          onVolumeChange={(e) => { setVolume(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}
        />

        {/* Loading spinner */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {/* Center play button when paused */}
        {!isPlaying && !isLoading && (
          <button
            onClick={togglePlay}
            aria-label="play"
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-105 sm:h-20 sm:w-20">
              <Play className="ml-1 h-8 w-8 sm:h-9 sm:w-9" />
            </span>
          </button>
        )}

        {/* Controls bar */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-10 transition-opacity duration-300 sm:px-4",
            showControls || !isPlaying ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {/* Seek */}
          <div className="relative mb-1">
            {duration > 0 && (
              <div
                className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25"
                style={{ width: `${(buffered / duration) * 100}%` }}
              />
            )}
            <Slider
              value={[current]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={onSeek}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 text-white hover:bg-white/15 hover:text-primary">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => seekBy(-10)} className="hidden h-8 w-8 text-white hover:bg-white/15 hover:text-primary sm:inline-flex" title="אחורה 10 שניות">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => seekBy(10)} className="hidden h-8 w-8 text-white hover:bg-white/15 hover:text-primary sm:inline-flex" title="קדימה 10 שניות">
                <RotateCw className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-white hover:bg-white/15 hover:text-primary">
                  {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <div className="hidden w-20 sm:block">
                  <Slider value={[muted ? 0 : volume * 100]} min={0} max={100} step={1} onValueChange={onVolume} className="cursor-pointer" />
                </div>
              </div>

              <span className="ml-1 select-none font-mono text-[11px] tabular-nums text-white/90 sm:text-xs">
                {fmt(current)} / {fmt(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Select value={rate} onValueChange={onRate}>
                <SelectTrigger className="h-8 w-[58px] border-white/20 bg-transparent text-xs text-white hover:border-primary/40 hover:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="ltr">
                  {SPEEDS.map((s) => <SelectItem key={s} value={s}>{s}x</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 text-white hover:bg-white/15 hover:text-primary">
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyVideoPlayer;
