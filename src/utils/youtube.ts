/**
 * Utility functions for parsing and embedding YouTube URLs and study streams.
 */

export interface ParsedYouTubeMedia {
  type: 'video' | 'playlist';
  id: string;
  embedUrl: string;
}

/**
 * Extracts a YouTube Video ID or Playlist ID from various URL formats.
 */
export function parseYouTubeUrl(input: string): ParsedYouTubeMedia | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct 11-char ID check (e.g. jfKfPfyJRdk)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      type: 'video',
      id: trimmed,
      embedUrl: `https://www.youtube-nocookie.com/embed/${trimmed}?autoplay=1&enablejsapi=1`,
    };
  }

  // 2. Playlist URL check: playlist?list=...
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('playlist') && playlistMatch && playlistMatch[1]) {
    const listId = playlistMatch[1];
    return {
      type: 'playlist',
      id: listId,
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}&autoplay=1&enablejsapi=1`,
    };
  }

  // 3. Short URLs: youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return {
      type: 'video',
      id: shortMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?autoplay=1&enablejsapi=1`,
    };
  }

  // 4. Live URLs: youtube.com/live/VIDEO_ID
  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) {
    return {
      type: 'video',
      id: liveMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${liveMatch[1]}?autoplay=1&enablejsapi=1`,
    };
  }

  // 5. Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return {
      type: 'video',
      id: shortsMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?autoplay=1&enablejsapi=1`,
    };
  }

  // 6. Embed URLs: youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) {
    return {
      type: 'video',
      id: embedMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${embedMatch[1]}?autoplay=1&enablejsapi=1`,
    };
  }

  // 7. Standard watch URLs: youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return {
      type: 'video',
      id: watchMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?autoplay=1&enablejsapi=1`,
    };
  }

  return null;
}
