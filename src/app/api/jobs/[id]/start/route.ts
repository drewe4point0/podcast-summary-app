import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { processJob } from '@/lib/pipeline/process-job';
import { getErrorMessage } from '@/lib/utils';
import type { Result } from '@/types';

// Long timeout for processing - Vercel Pro supports up to 300s
export const maxDuration = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Start processing a job
 * This endpoint is called by the client after job creation
 * The connection stays open while processing completes
 */
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<Result<{ completed: boolean }>>> {
  const { id: jobId } = await params;

  try {
    const supabase = createAdminClient();

    // Verify job exists and is in pending/fetching state
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Don't re-process completed or failed jobs
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({
        ok: true,
        data: { completed: job.status === 'completed' },
      });
    }

    // Process the job - this will take a while
    await processJob(jobId);

    return NextResponse.json({
      ok: true,
      data: { completed: true },
    });
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
