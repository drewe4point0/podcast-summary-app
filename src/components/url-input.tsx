'use client';

import { useState } from 'react';
import { extractYouTubeId, fetchVideoMetadata } from '@/lib/utils';
import type { VideoMetadata } from '@/types';

interface UrlInputProps {
  onVideoFound: (metadata: VideoMetadata, url: string) => void;
  isLoading?: boolean;
}

export function UrlInput({ onVideoFound, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    const videoId = extractYouTubeId(trimmedUrl);
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }

    setIsValidating(true);

    try {
      const metadata = await fetchVideoMetadata(videoId);

      if (!metadata) {
        setError('Could not find video. It may be private or unavailable.');
        return;
      }

      onVideoFound(
        {
          id: videoId,
          title: metadata.title,
          channel: metadata.channel,
          thumbnailUrl: metadata.thumbnailUrl,
        },
        trimmedUrl
      );
    } catch {
      setError('Failed to fetch video information. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div className="space-y-2">
        <label htmlFor="youtube-url" className="block text-sm font-medium">
          YouTube URL
        </label>
        <div className="flex gap-2">
          <input
            id="youtube-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            disabled={isLoading || isValidating}
          />
          <button
            type="submit"
            disabled={isLoading || isValidating}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isValidating ? 'Checking...' : 'Find Video'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}

      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Paste a YouTube video URL to get an AI-powered summary of the content.
      </p>
    </form>
  );
}
