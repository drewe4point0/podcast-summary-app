import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/utils';
import type { Result, JobResult, Job, JobProgress, Transcript, Summary } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<Result<JobResult>>> {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch job
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Map database row to Job type
    const job: Job = {
      id: jobData.id,
      status: jobData.status,
      progress: (jobData.progress as JobProgress) ?? { stage: jobData.status },
      youtubeUrl: jobData.youtube_url,
      youtubeId: jobData.youtube_id,
      videoMetadata: jobData.video_title
        ? {
            id: jobData.youtube_id,
            title: jobData.video_title,
            channel: jobData.video_channel ?? '',
            thumbnailUrl: jobData.video_thumbnail_url ?? '',
          }
        : undefined,
      error: jobData.error ?? undefined,
      notificationEmail: jobData.notification_email ?? undefined,
      createdAt: jobData.created_at,
      completedAt: jobData.completed_at ?? undefined,
    };

    // If job is not completed, return just the job status
    if (job.status !== 'completed') {
      return NextResponse.json({
        ok: true,
        data: { job },
      });
    }

    // Job is completed - fetch transcript and summary
    const [transcriptResult, summaryResult] = await Promise.all([
      supabase.from('transcripts').select('*').eq('job_id', jobId).single(),
      supabase.from('summaries').select('*').eq('job_id', jobId).single(),
    ]);

    const transcript: Transcript | undefined = transcriptResult.data
      ? {
          jobId: transcriptResult.data.job_id,
          rawText: transcriptResult.data.raw_text,
          cleanedText: transcriptResult.data.cleaned_text ?? undefined,
          speakers: (transcriptResult.data.speakers as string[]) ?? undefined,
        }
      : undefined;

    const summary: Summary | undefined = summaryResult.data
      ? {
          jobId: summaryResult.data.job_id,
          content: summaryResult.data.content,
          promptVersion: summaryResult.data.prompt_version,
        }
      : undefined;

    return NextResponse.json({
      ok: true,
      data: {
        job,
        transcript,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
