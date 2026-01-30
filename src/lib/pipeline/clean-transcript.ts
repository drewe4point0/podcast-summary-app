import OpenAI from 'openai';
import { chunkText, estimateTokens, getErrorMessage, retry } from '@/lib/utils';
import type { Result, VideoMetadata } from '@/types';

interface CleanTranscriptResult {
  cleanedText: string;
  speakers: string[];
}

interface ProgressCallback {
  (current: number, total: number): void;
}

// Max tokens per chunk - increased to reduce number of API calls for long videos
// GPT-4o supports 128k context, so we can use larger chunks
const MAX_TOKENS_PER_CHUNK = 15000;
const OVERLAP_TOKENS = 500;

/**
 * Search for speaker information using Tavily API
 */
async function searchSpeakers(
  videoTitle: string,
  channelName: string
): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return ''; // Fallback: no web search available
  }

  try {
    const query = `Who are the speakers in "${videoTitle}" by ${channelName}? podcast guests host names`;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 3,
      }),
    });

    if (!response.ok) {
      return '';
    }

    const data = (await response.json()) as {
      results?: Array<{ content: string }>;
    };

    // Combine search results for context
    const context = data.results
      ?.slice(0, 3)
      .map((r) => r.content)
      .join('\n\n');

    return context ?? '';
  } catch {
    return '';
  }
}

/**
 * Clean and format a single chunk of transcript using OpenAI
 */
async function cleanChunk(
  openai: OpenAI,
  chunk: string,
  videoMetadata: VideoMetadata,
  speakerContext: string,
  isFirstChunk: boolean
): Promise<string> {
  const systemPrompt = `You are formatting a podcast transcript. Your job is to:
1. Add speaker labels in the format [Speaker Name]:
2. Fix obvious transcription errors
3. Add paragraph breaks for readability
4. Preserve the EXACT wording - do not summarize or paraphrase

The podcast is: "${videoMetadata.title}" from channel "${videoMetadata.channel}"

${speakerContext ? `Additional context about the speakers:\n${speakerContext}\n` : ''}

Rules:
- If you can identify speakers from the title, channel name, or context, use their actual names
- If you cannot identify a speaker, use "Speaker 1", "Speaker 2", etc. and be consistent
- Start each speaker's turn on a new line with their name in brackets
- Group related sentences into paragraphs
- Do NOT add any commentary or notes - just format the transcript`;

  const userPrompt = isFirstChunk
    ? `Format this podcast transcript:\n\n${chunk}`
    : `Continue formatting this podcast transcript (maintain the same speaker labels as before):\n\n${chunk}`;

  const response = await retry(
    async () => {
      return openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent formatting
        max_tokens: 16000, // Increased to handle larger chunks
      });
    },
    3,
    2000
  );

  return response.choices[0]?.message?.content ?? chunk;
}

/**
 * Extract unique speaker names from cleaned transcript
 */
function extractSpeakers(text: string): string[] {
  const speakerPattern = /\[([^\]]+)\]:/g;
  const speakers = new Set<string>();

  let match;
  while ((match = speakerPattern.exec(text)) !== null) {
    if (match[1]) {
      speakers.add(match[1]);
    }
  }

  return Array.from(speakers);
}

/**
 * Clean and format a transcript using AI
 * Handles chunking for long transcripts
 */
export async function cleanTranscript(
  rawText: string,
  videoMetadata: VideoMetadata,
  onProgress?: ProgressCallback
): Promise<Result<CleanTranscriptResult>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'OpenAI API key not configured' };
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Estimate if we need chunking
    const totalTokens = estimateTokens(rawText);
    const needsChunking = totalTokens > MAX_TOKENS_PER_CHUNK;

    // Search for speaker information (do this once for all chunks)
    const speakerContext = await searchSpeakers(
      videoMetadata.title,
      videoMetadata.channel
    );

    if (!needsChunking) {
      // Single chunk processing
      onProgress?.(1, 1);

      const cleaned = await cleanChunk(
        openai,
        rawText,
        videoMetadata,
        speakerContext,
        true
      );

      const speakers = extractSpeakers(cleaned);

      return {
        ok: true,
        data: {
          cleanedText: cleaned,
          speakers,
        },
      };
    }

    // Multi-chunk processing
    const chunks = chunkText(rawText, MAX_TOKENS_PER_CHUNK, OVERLAP_TOKENS);
    const cleanedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      onProgress?.(i + 1, chunks.length);

      const chunk = chunks[i];
      if (!chunk) continue;

      const cleaned = await cleanChunk(
        openai,
        chunk,
        videoMetadata,
        speakerContext,
        i === 0
      );

      cleanedChunks.push(cleaned);
    }

    // Merge chunks (remove overlap by looking for repeated content)
    const mergedText = mergeChunks(cleanedChunks);
    const speakers = extractSpeakers(mergedText);

    return {
      ok: true,
      data: {
        cleanedText: mergedText,
        speakers,
      },
    };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/**
 * Merge cleaned chunks, removing duplicate content from overlaps
 */
function mergeChunks(chunks: string[]): string {
  if (chunks.length === 0) return '';
  if (chunks.length === 1) return chunks[0] ?? '';

  let merged = chunks[0] ?? '';

  for (let i = 1; i < chunks.length; i++) {
    const currentChunk = chunks[i];
    if (!currentChunk) continue;

    // Try to find overlap by looking for the last paragraph of previous chunk
    // in the beginning of current chunk
    const lastParagraphs = merged.split('\n\n').slice(-2).join('\n\n');
    const overlapIndex = currentChunk.indexOf(lastParagraphs.slice(-200));

    if (overlapIndex > 0 && overlapIndex < 500) {
      // Found overlap, append from after the overlap
      merged += '\n\n' + currentChunk.slice(overlapIndex + lastParagraphs.slice(-200).length).trim();
    } else {
      // No clear overlap found, just append with paragraph break
      merged += '\n\n' + currentChunk;
    }
  }

  return merged.trim();
}
