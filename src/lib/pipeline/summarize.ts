import OpenAI from 'openai';
import { chunkText, estimateTokens, getErrorMessage, retry } from '@/lib/utils';
import type { Result, VideoMetadata } from '@/types';

// Current prompt version - increment when making significant changes
export const PROMPT_VERSION = 'v1';

// Max tokens for the context window
const MAX_CONTEXT_TOKENS = 100000; // GPT-4o supports 128k

/**
 * Generate a summary from a cleaned transcript
 */
export async function summarize(
  cleanedText: string,
  videoMetadata: VideoMetadata
): Promise<Result<string>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'OpenAI API key not configured' };
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Check if transcript is too long and needs chunked summarization
    const totalTokens = estimateTokens(cleanedText);

    if (totalTokens > MAX_CONTEXT_TOKENS) {
      return summarizeInChunks(openai, cleanedText, videoMetadata);
    }

    return summarizeDirect(openai, cleanedText, videoMetadata);
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/**
 * Direct summarization for transcripts that fit in context
 */
async function summarizeDirect(
  openai: OpenAI,
  cleanedText: string,
  videoMetadata: VideoMetadata
): Promise<Result<string>> {
  const systemPrompt = `You are an expert at summarizing podcasts. Create a comprehensive summary that captures the key information.

Format your summary as follows:

## Overview
A 2-3 sentence overview of what this podcast episode is about.

## Key Topics
- Topic 1
- Topic 2
- etc.

## Key Insights & Takeaways
- Insight 1 (with any relevant quotes or attributions)
- Insight 2
- etc.

## Notable Quotes
> "Quote 1" — Speaker Name
> "Quote 2" — Speaker Name

## Action Items / Recommendations
(If any were mentioned in the podcast)
- Item 1
- Item 2

Guidelines:
- Be thorough but concise
- Attribute quotes and insights to speakers when known
- Focus on information that would be valuable to someone who hasn't listened
- Use bullet points for easy scanning
- Include 3-5 notable quotes that capture key ideas`;

  const userPrompt = `Summarize this podcast:

Title: ${videoMetadata.title}
Channel: ${videoMetadata.channel}

Transcript:
${cleanedText}`;

  const response = await retry(
    async () => {
      return openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      });
    },
    3,
    2000
  );

  const summary = response.choices[0]?.message?.content;

  if (!summary) {
    return { ok: false, error: 'Failed to generate summary' };
  }

  return { ok: true, data: summary };
}

/**
 * Chunked summarization for very long transcripts
 * Creates section summaries, then combines them
 */
async function summarizeInChunks(
  openai: OpenAI,
  cleanedText: string,
  videoMetadata: VideoMetadata
): Promise<Result<string>> {
  // Split into manageable chunks
  const chunks = chunkText(cleanedText, 50000, 500);

  // Summarize each chunk
  const chunkSummaries: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    const response = await retry(
      async () => {
        return openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Summarize this section of a podcast transcript. Focus on key points, insights, and notable quotes. This is part ${i + 1} of ${chunks.length}.`,
            },
            {
              role: 'user',
              content: `Podcast: ${videoMetadata.title}\n\nSection ${i + 1}:\n${chunk}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        });
      },
      3,
      2000
    );

    const sectionSummary = response.choices[0]?.message?.content;
    if (sectionSummary) {
      chunkSummaries.push(`### Part ${i + 1}\n${sectionSummary}`);
    }
  }

  // Now combine all section summaries into a final summary
  const combinedSections = chunkSummaries.join('\n\n---\n\n');

  const finalResponse = await retry(
    async () => {
      return openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You have section summaries from a long podcast. Create a cohesive final summary that:
1. Synthesizes all sections into a unified overview
2. Identifies the main themes across all sections
3. Highlights the most important insights
4. Includes the best quotes from across the podcast

Use this format:
## Overview
## Key Topics
## Key Insights & Takeaways
## Notable Quotes
## Action Items / Recommendations (if any)`,
          },
          {
            role: 'user',
            content: `Podcast: ${videoMetadata.title} by ${videoMetadata.channel}

Section summaries to synthesize:
${combinedSections}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      });
    },
    3,
    2000
  );

  const finalSummary = finalResponse.choices[0]?.message?.content;

  if (!finalSummary) {
    return { ok: false, error: 'Failed to generate final summary' };
  }

  return { ok: true, data: finalSummary };
}
