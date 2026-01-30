import { createAdminClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/utils';
import { fetchTranscript } from './fetch-transcript';
import { cleanTranscript } from './clean-transcript';
import { summarize, PROMPT_VERSION } from './summarize';
import type { JobProgress, VideoMetadata } from '@/types';

/**
 * Update job progress in database
 */
async function updateJobProgress(
  jobId: string,
  progress: JobProgress,
  status?: string,
  error?: string
) {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    progress,
  };

  if (status) {
    updateData.status = status;
  }

  if (error !== undefined) {
    updateData.error = error;
  }

  const { error: updateError } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId);

  if (updateError) {
    console.error(`Failed to update job ${jobId}:`, updateError);
  }
}

/**
 * Main job processing function
 * Orchestrates the 3-stage pipeline: fetch → clean → summarize
 */
export async function processJob(jobId: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Fetch job details
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error(`Job ${jobId} not found:`, fetchError);
      return;
    }

    const videoMetadata: VideoMetadata = {
      id: job.youtube_id,
      title: job.video_title ?? 'Unknown',
      channel: job.video_channel ?? 'Unknown',
      thumbnailUrl: job.video_thumbnail_url ?? '',
    };

    // ═══════════════════════════════════════════════════════════════
    // STAGE 1: Fetch Transcript
    // ═══════════════════════════════════════════════════════════════
    await updateJobProgress(
      jobId,
      { stage: 'fetching', message: 'Fetching transcript from YouTube...' },
      'fetching'
    );

    const transcriptResult = await fetchTranscript(job.youtube_id);

    if (!transcriptResult.ok) {
      await updateJobProgress(
        jobId,
        { stage: 'failed', message: transcriptResult.error },
        'failed',
        transcriptResult.error
      );
      return;
    }

    const rawTranscript = transcriptResult.data;

    // Save raw transcript
    const { error: insertTranscriptError } = await supabase
      .from('transcripts')
      .insert({
        job_id: jobId,
        raw_text: rawTranscript,
      });

    if (insertTranscriptError) {
      console.error(`Failed to save transcript for ${jobId}:`, insertTranscriptError);
    }

    // ═══════════════════════════════════════════════════════════════
    // STAGE 2: Clean Transcript
    // ═══════════════════════════════════════════════════════════════
    await updateJobProgress(
      jobId,
      { stage: 'cleaning', message: 'Formatting transcript...', current: 0, total: 1 },
      'cleaning'
    );

    const cleanResult = await cleanTranscript(
      rawTranscript,
      videoMetadata,
      async (current, total) => {
        await updateJobProgress(jobId, {
          stage: 'cleaning',
          message: `Cleaning transcript: ${current}/${total} chunks`,
          current,
          total,
        });
      }
    );

    if (!cleanResult.ok) {
      await updateJobProgress(
        jobId,
        { stage: 'failed', message: cleanResult.error },
        'failed',
        cleanResult.error
      );
      return;
    }

    // Update transcript with cleaned version
    const { error: updateTranscriptError } = await supabase
      .from('transcripts')
      .update({
        cleaned_text: cleanResult.data.cleanedText,
        speakers: cleanResult.data.speakers,
      })
      .eq('job_id', jobId);

    if (updateTranscriptError) {
      console.error(`Failed to update transcript for ${jobId}:`, updateTranscriptError);
    }

    // ═══════════════════════════════════════════════════════════════
    // STAGE 3: Summarize
    // ═══════════════════════════════════════════════════════════════
    await updateJobProgress(
      jobId,
      { stage: 'summarizing', message: 'Generating summary...' },
      'summarizing'
    );

    const summaryResult = await summarize(cleanResult.data.cleanedText, videoMetadata);

    if (!summaryResult.ok) {
      await updateJobProgress(
        jobId,
        { stage: 'failed', message: summaryResult.error },
        'failed',
        summaryResult.error
      );
      return;
    }

    // Save summary
    const { error: insertSummaryError } = await supabase.from('summaries').insert({
      job_id: jobId,
      content: summaryResult.data,
      prompt_version: PROMPT_VERSION,
    });

    if (insertSummaryError) {
      console.error(`Failed to save summary for ${jobId}:`, insertSummaryError);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLETE
    // ═══════════════════════════════════════════════════════════════
    await updateJobProgress(
      jobId,
      { stage: 'completed', message: 'Summary ready!' },
      'completed'
    );

    // Send notification email if provided
    if (job.notification_email) {
      try {
        await sendCompletionEmail(
          job.notification_email,
          jobId,
          videoMetadata.title
        );
      } catch (emailError) {
        console.error(`Failed to send notification email for ${jobId}:`, emailError);
        // Don't fail the job for email errors
      }
    }

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Job ${jobId} failed with error:`, errorMessage);

    await updateJobProgress(
      jobId,
      { stage: 'failed', message: errorMessage },
      'failed',
      errorMessage
    );
  }
}

/**
 * Send completion notification email
 */
async function sendCompletionEmail(
  email: string,
  jobId: string,
  videoTitle: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('Resend API key not configured, skipping notification email');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const jobUrl = `${appUrl}/job/${jobId}`;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: 'Podcast Summary <onboarding@resend.dev>',
    to: email,
    subject: `Your podcast summary is ready: ${videoTitle}`,
    html: `
      <h2>Your summary is ready!</h2>
      <p>We've finished summarizing: <strong>${videoTitle}</strong></p>
      <p><a href="${jobUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">View Your Summary</a></p>
      <p style="color: #666; font-size: 14px;">This link will remain active so you can access your summary anytime.</p>
    `,
  });
}
