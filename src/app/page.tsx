'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UrlInput } from '@/components/url-input';
import { VideoPreview } from '@/components/video-preview';
import type { VideoMetadata } from '@/types';

export default function Home() {
  const router = useRouter();
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleVideoFound(metadata: VideoMetadata, url: string) {
    setVideoMetadata(metadata);
    setVideoUrl(url);
    setError('');
  }

  async function handleProcess(email?: string) {
    if (!videoUrl) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: videoUrl,
          notificationEmail: email || undefined,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        // Redirect to job page
        router.push(`/job/${result.data.jobId}`);
      } else {
        setError(result.error || 'Failed to start processing');
        setIsProcessing(false);
      }
    } catch {
      setError('Failed to start processing. Please try again.');
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setVideoMetadata(null);
    setVideoUrl('');
    setError('');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Podcast Summary</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get AI-powered summaries of your favorite YouTube podcasts
          </p>
        </div>

        {/* Main content */}
        {!videoMetadata ? (
          <UrlInput onVideoFound={handleVideoFound} isLoading={isProcessing} />
        ) : (
          <div className="space-y-4">
            <VideoPreview
              metadata={videoMetadata}
              onProcess={handleProcess}
              isProcessing={isProcessing}
            />
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="text-gray-500 hover:text-black dark:hover:text-white text-sm disabled:opacity-50"
            >
              ← Choose different video
            </button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Info section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-medium">Paste URL</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter any YouTube video URL, especially podcasts and interviews
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-medium">AI Processing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We fetch the transcript and use AI to clean it up and identify speakers
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-medium">Get Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive a comprehensive summary with key insights, quotes, and takeaways
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
