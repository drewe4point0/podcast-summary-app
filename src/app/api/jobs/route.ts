import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createJobSchema } from '@/lib/validation';
import { extractYouTubeId, fetchVideoMetadata, getErrorMessage } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/server';
import type { Result, CreateJobResponse } from '@/types';

// Vercel serverless functions have a max duration - set to 60s for Pro plan
// For hobby plan, max is 10s which may not be enough for processing
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse<Result<CreateJobResponse>>> {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = createJobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { youtubeUrl, notificationEmail } = validation.data;

    // Extract YouTube video ID
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { ok: false, error: 'Could not extract video ID from URL' },
        { status: 400 }
      );
    }

    // Fetch video metadata to verify video exists and get title/thumbnail
    const metadata = await fetchVideoMetadata(youtubeId);
    if (!metadata) {
      return NextResponse.json(
        { ok: false, error: 'Could not fetch video information. The video may be private or unavailable.' },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = nanoid(12);

    // Create job in database
    const supabase = createAdminClient();
    const { error: insertError } = await supabase.from('jobs').insert({
      id: jobId,
      status: 'pending',
      youtube_url: youtubeUrl,
      youtube_id: youtubeId,
      video_title: metadata.title,
      video_channel: metadata.channel,
      video_thumbnail_url: metadata.thumbnailUrl,
      progress: { stage: 'pending', message: 'Job created' },
      notification_email: notificationEmail || null,
    });

    if (insertError) {
      console.error('Failed to create job:', insertError);
      return NextResponse.json(
        { ok: false, error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // Return job ID and shareable URL immediately
    // The client will start polling while we process
    const shareableUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/job/${jobId}`;

    return NextResponse.json({
      ok: true,
      data: {
        jobId,
        shareableUrl,
      },
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
