/**
 * Utility functions for parsing and converting video URLs to embed format
 */

export interface ParsedVideo {
  provider: 'youtube' | 'vimeo' | 'direct';
  videoId: string;
  embedUrl: string;
  originalUrl: string;
  startTime?: number;
  thumbnail?: string;
}

/**
 * Extracts video ID from YouTube URL and converts to embed URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (already embed)
 */
const parseYouTubeUrl = (url: string): ParsedVideo | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      
      // Extract start time if present (t=123s or start=123)
      const timeMatch = url.match(/[?&](?:t|start)=(\d+)/);
      const startTime = timeMatch ? parseInt(timeMatch[1]) : undefined;
      
      // Build embed URL with start time if present
      let embedUrl = `https://www.youtube.com/embed/${videoId}`;
      if (startTime) {
        embedUrl += `?start=${startTime}`;
      }
      
      return {
        provider: 'youtube',
        videoId,
        embedUrl,
        originalUrl: url,
        startTime,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }
  }
  
  return null;
};

/**
 * Extracts video ID from Vimeo URL and converts to embed URL
 * Supports formats:
 * - https://vimeo.com/VIDEO_ID
 * - https://vimeo.com/channels/CHANNEL/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID (already embed)
 */
const parseVimeoUrl = (url: string): ParsedVideo | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/channels\/[^\/]+\/(\d+)/,
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      const embedUrl = `https://player.vimeo.com/video/${videoId}`;
      
      return {
        provider: 'vimeo',
        videoId,
        embedUrl,
        originalUrl: url,
        thumbnail: `https://vumbnail.com/${videoId}.jpg`,
      };
    }
  }
  
  return null;
};

/**
 * Main function to parse any video URL and convert to embed format
 * Returns parsed video data with embed URL, or null if URL is invalid
 * 
 * @param url - The video URL to parse (YouTube, Vimeo, or direct video file)
 * @returns ParsedVideo object with embed URL, or null if invalid
 * 
 * @example
 * // YouTube
 * parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // Returns: { provider: 'youtube', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ... }
 * 
 * @example
 * // Vimeo
 * parseVideoUrl('https://vimeo.com/1077197518')
 * // Returns: { provider: 'vimeo', embedUrl: 'https://player.vimeo.com/video/1077197518', ... }
 */
export const parseVideoUrl = (url: string): ParsedVideo | null => {
  if (!url || !url.trim()) {
    return null;
  }

  const trimmedUrl = url.trim();

  // Try YouTube
  const youtubeResult = parseYouTubeUrl(trimmedUrl);
  if (youtubeResult) {
    return youtubeResult;
  }

  // Try Vimeo
  const vimeoResult = parseVimeoUrl(trimmedUrl);
  if (vimeoResult) {
    return vimeoResult;
  }

  // If it's a direct video file URL (mp4, webm, etc.), return as-is
  if (trimmedUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return {
      provider: 'direct',
      videoId: '',
      embedUrl: trimmedUrl,
      originalUrl: trimmedUrl,
    };
  }

  return null;
};

/**
 * Converts a regular YouTube or Vimeo URL to its embed URL
 * If already an embed URL, returns it unchanged
 * 
 * @param url - The video URL to convert
 * @returns The embed URL, or the original URL if conversion fails
 * 
 * @example
 * convertToEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // Returns: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
 */
export const convertToEmbedUrl = (url: string): string => {
  const parsed = parseVideoUrl(url);
  return parsed ? parsed.embedUrl : url;
};
