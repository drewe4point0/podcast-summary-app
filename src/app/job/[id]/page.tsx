'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProgressBar } from '@/components/progress-bar';
import { SummaryDisplay } from '@/components/summary-display';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { ExportButtons } from '@/components/export-buttons';
import type { JobResult } from '@/types';

const POLL_INTERVAL = 3000; // 3 seconds

export default function JobPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [jobResult, setJobResult] = useState<JobResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const result = await response.json();

      if (result.ok) {
        setJobResult(result.data);
        setError('');
      } else {
        setError(result.error || 'Failed to load job');
      }
    } catch {
      setError('Failed to load job. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJob();

    // Set up polling for non-completed jobs
    const pollInterval = setInterval(() => {
      if (
        jobResult?.job.status !== 'completed' &&
        jobResult?.job.status !== 'failed'
      ) {
        fetchJob();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [jobId, fetchJob, jobResult?.job.status]);

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !jobResult) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'Job not found'}
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
          >
            Try Another Video
          </Link>
        </div>
      </main>
    );
  }

  const { job, transcript, summary } = jobResult;
  const isComplete = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with video info */}
        {job.videoMetadata && (
          <div className="flex gap-4 items-start">
            <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={job.videoMetadata.thumbnailUrl}
                alt={job.videoMetadata.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold line-clamp-2">
                {job.videoMetadata.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {job.videoMetadata.channel}
              </p>
            </div>
          </div>
        )}

        {/* Shareable link */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Shareable link (bookmark this to come back later):
          </p>
          <code className="text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700 break-all">
            {typeof window !== 'undefined' ? window.location.href : `/job/${jobId}`}
          </code>
        </div>

        {/* Progress bar (for non-completed jobs) */}
        {!isComplete && (
          <div className="flex justify-center py-8">
            <ProgressBar progress={job.progress} status={job.status} />
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Processing Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {job.error || 'An error occurred while processing your video.'}
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Completed state - show results */}
        {isComplete && summary && (
          <>
            {/* Export buttons */}
            <ExportButtons
              summary={summary.content}
              title={job.videoMetadata?.title ?? 'Podcast Summary'}
              jobId={jobId}
            />

            {/* Summary */}
            <SummaryDisplay
              content={summary.content}
              title={job.videoMetadata?.title ?? 'Podcast Summary'}
            />

            {/* Transcript */}
            {transcript?.cleanedText && (
              <TranscriptViewer
                transcript={transcript.cleanedText}
                speakers={transcript.speakers}
              />
            )}

            {/* Process another */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:opacity-90"
              >
                Summarize Another Podcast
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
