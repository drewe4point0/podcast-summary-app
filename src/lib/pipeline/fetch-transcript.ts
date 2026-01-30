import { getErrorMessage, retry } from '@/lib/utils';
import type { Result } from '@/types';

interface TranscriptSegment {
  text: string;
  start: string;
  dur: string;
}

interface TranscriptTrack {
  language: string;
  transcript: TranscriptSegment[];
}

interface TranscriptItem {
  id: string;
  title?: string;
  text?: string; // Full pre-joined transcript text
  tracks?: TranscriptTrack[]; // Individual transcript segments by language
  error?: string;
}

// The API returns an array directly, not wrapped in an object
type YouTubeTranscriptResponse = TranscriptItem[];

/**
 * Fetch transcript from YouTube using youtube-transcript.io API
 * API docs: https://www.youtube-transcript.io/api
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
        'https://www.youtube-transcript.io/api/transcripts',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: [youtubeId],
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();

        // Check for specific error cases
        if (res.status === 401) {
          throw new Error('Invalid API key. Please check your YOUTUBE_TRANSCRIPT_API_KEY.');
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

    // The API returns an array directly
    const data = response as YouTubeTranscriptResponse;

    // Check if we got any results
    if (!Array.isArray(data) || data.length === 0) {
      console.log('[fetchTranscript] Empty or invalid response');
      return { ok: false, error: 'No transcript returned from API.' };
    }

    const transcriptItem = data[0];

    if (!transcriptItem) {
      return { ok: false, error: 'No transcript data found.' };
    }

    // Check for error in the transcript item
    if (transcriptItem.error) {
      return { ok: false, error: transcriptItem.error };
    }

    // The API provides a pre-joined 'text' field with the full transcript
    let fullText = '';

    if (transcriptItem.text) {
      // Use the pre-joined text if available
      fullText = transcriptItem.text.trim();
    } else if (transcriptItem.tracks && transcriptItem.tracks.length > 0) {
      // Fall back to combining segments from the first track
      const track = transcriptItem.tracks[0];
      if (track?.transcript && track.transcript.length > 0) {
        fullText = track.transcript
          .map((segment) => segment.text.trim())
          .filter((text) => text && text !== '\n') // Filter out empty segments
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    if (!fullText) {
      return { ok: false, error: 'No transcript available for this video. The video may not have captions enabled.' };
    }

    // Clean up any remaining artifacts
    fullText = fullText.replace(/\s+/g, ' ').trim();

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
