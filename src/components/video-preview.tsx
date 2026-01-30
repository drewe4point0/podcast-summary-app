'use client';

import Image from 'next/image';
import type { VideoMetadata } from '@/types';

interface VideoPreviewProps {
  metadata: VideoMetadata;
  onProcess: (email?: string) => void;
  isProcessing?: boolean;
}

export function VideoPreview({
  metadata,
  onProcess,
  isProcessing,
}: VideoPreviewProps) {
  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        <Image
          src={metadata.thumbnailUrl}
          alt={metadata.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold line-clamp-2">{metadata.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {metadata.channel}
          </p>
        </div>

        {/* Email input (optional) */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-gray-600 dark:text-gray-400">
            Email for notification (optional)
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            disabled={isProcessing}
          />
          <p className="text-xs text-gray-500">
            We&apos;ll email you when your summary is ready (useful for long podcasts)
          </p>
        </div>

        {/* Process button */}
        <button
          onClick={() => {
            const emailInput = document.getElementById('email') as HTMLInputElement;
            onProcess(emailInput?.value || undefined);
          }}
          disabled={isProcessing}
          className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isProcessing ? 'Starting...' : 'Generate Summary'}
        </button>
      </div>
    </div>
  );
}
