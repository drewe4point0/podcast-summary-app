/**
 * Extract error message from unknown error type
 * Pattern from CLAUDE.md
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - m.youtube.com/watch?v=VIDEO_ID
 * - Just the video ID itself
 */
export function extractYouTubeId(url: string): string | null {
  // Clean up the URL
  const trimmed = url.trim();

  // Pattern 1: Standard YouTube URLs
  // Matches: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, m.youtube.com/watch?v=
  const urlPattern =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;

  const urlMatch = trimmed.match(urlPattern);
  if (urlMatch?.[1]) return urlMatch[1];

  // Pattern 2: URL with additional parameters (e.g., &t=120)
  const paramPattern = /[?&]v=([a-zA-Z0-9_-]{11})/;
  const paramMatch = trimmed.match(paramPattern);
  if (paramMatch?.[1]) return paramMatch[1];

  // Pattern 3: Just the video ID (11 characters, alphanumeric + _ -)
  const idPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (idPattern.test(trimmed)) return trimmed;

  return null;
}

/**
 * Fetch video metadata from YouTube using oEmbed API
 * This is a public API that doesn't require authentication
 */
export async function fetchVideoMetadata(videoId: string): Promise<{
  title: string;
  channel: string;
  thumbnailUrl: string;
} | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };

    return {
      title: data.title ?? 'Unknown Title',
      channel: data.author_name ?? 'Unknown Channel',
      thumbnailUrl:
        data.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

/**
 * Estimate token count for a string
 * Rough estimate: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks of approximately maxTokens each
 * Tries to split on sentence boundaries when possible
 */
export function chunkText(
  text: string,
  maxTokens: number,
  overlapTokens: number = 500
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap from end of previous chunk
      const overlapChars = overlapTokens * 4;
      const overlap = currentChunk.slice(-overlapChars);
      currentChunk = overlap + ' ' + sentence;
      currentTokens = estimateTokens(currentChunk);
    } else {
      currentChunk += ' ' + sentence;
      currentTokens += sentenceTokens;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Format duration from seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
