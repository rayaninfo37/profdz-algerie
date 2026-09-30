/**
 * PROF DZ YouTube URL Utilities
 * Validates and extracts YouTube video IDs safely.
 * Only allows known YouTube URL patterns — no arbitrary iframes.
 */

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from common URL formats.
 * Returns null if the URL is invalid or unrecognized.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Reject obviously dangerous patterns
  if (/javascript:|data:|vbscript:/i.test(trimmed)) return null;

  // Raw 11-char ID
  if (YT_ID_REGEX.test(trimmed)) return trimmed;

  try {
    // youtube.com/watch?v=ID
    let m = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:[&?]|$)/);
    if (m) return m[1];

    // youtu.be/ID
    m = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?&/]|$)/);
    if (m) return m[1];

    // youtube.com/embed/ID
    m = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[?/]|$)/);
    if (m) return m[1];

    // youtube.com/shorts/ID
    m = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[?/]|$)/);
    if (m) return m[1];

    // youtube.com/v/ID
    m = trimmed.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:[?/]|$)/);
    if (m) return m[1];
  } catch {
    return null;
  }

  return null;
}

/**
 * Builds a privacy-enhanced YouTube embed URL from a video ID.
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  if (!YT_ID_REGEX.test(videoId)) return '';
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * Validates a YouTube URL and returns the video ID, or null if invalid.
 */
export function validateYouTubeUrl(url: string): { valid: boolean; videoId: string | null; error?: string } {
  if (!url || !url.trim()) return { valid: true, videoId: null }; // empty = optional, OK
  const id = extractYouTubeId(url.trim());
  if (!id) {
    return { valid: false, videoId: null, error: 'رابط يوتيوب غير صالح. يرجى استخدام رابط youtube.com أو youtu.be.' };
  }
  return { valid: true, videoId: id };
}
