import { getErrorMessage, retry } from '@/lib/utils';
import type { Result } from '@/types';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface YouTubeTranscriptResponse {
  content: TranscriptSegment[];
  title?: string;
}

/**
 * Fetch transcript from YouTube using youtube-transcript.io API
 */
export async function fetchTranscript(youtubeId: string): Promise<Result<string>> {
  const apiKey = process.env.YOUTUBE_TRANSCRIPT_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'YouTube Transcript API key not configured' };
  }

  try {
    // Use retry wrapper for resilience
    const response = await retry(async () => {
      const res = await fetch(
        `https://api.youtube-transcript.io/v1/transcript?video_id=${youtubeId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text();

        // Check for specific error cases
        if (res.status === 404) {
          throw new Error('No transcript available for this video. The video may not have captions enabled.');
        }
        if (res.status === 403) {
          throw new Error('Cannot access transcript. The video may be private or restricted.');
        }
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        }

        throw new Error(`Failed to fetch transcript: ${errorText || res.statusText}`);
      }

      return res.json();
    }, 3, 2000);

    const data = response as YouTubeTranscriptResponse;

    // Check if we got content
    if (!data.content || data.content.length === 0) {
      return { ok: false, error: 'No transcript content found for this video.' };
    }

    // Combine all segments into a single text
    const fullText = data.content
      .map((segment) => segment.text.trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!fullText) {
      return { ok: false, error: 'Transcript is empty.' };
    }

    return { ok: true, data: fullText };
  } catch (error) {
    const message = getErrorMessage(error);

    // Provide user-friendly error messages
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      return { ok: false, error: 'Could not connect to transcript service. Please try again.' };
    }

    return { ok: false, error: message };
  }
}

/**
 * Validate that a video has a transcript available
 * This is a lighter check than fetching the full transcript
 */
export async function hasTranscript(youtubeId: string): Promise<boolean> {
  const result = await fetchTranscript(youtubeId);
  return result.ok;
}
