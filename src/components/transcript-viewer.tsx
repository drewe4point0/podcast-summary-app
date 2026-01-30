'use client';

import { useState } from 'react';

interface TranscriptViewerProps {
  transcript: string;
  speakers?: string[];
}

// Colors for different speakers
const SPEAKER_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-green-600 dark:text-green-400',
  'text-purple-600 dark:text-purple-400',
  'text-orange-600 dark:text-orange-400',
  'text-pink-600 dark:text-pink-400',
  'text-teal-600 dark:text-teal-400',
];

export function TranscriptViewer({ transcript, speakers = [] }: TranscriptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create speaker -> color mapping
  const speakerColors: Record<string, string> = {};
  speakers.forEach((speaker, index) => {
    const colorIndex = index % SPEAKER_COLORS.length;
    speakerColors[speaker] = SPEAKER_COLORS[colorIndex] ?? 'text-gray-900 dark:text-gray-100';
  });

  // Format transcript with speaker highlighting
  const formatTranscript = (text: string) => {
    // Split by speaker labels and format
    const lines = text.split('\n');

    return lines.map((line, index) => {
      // Check if line starts with a speaker label [Name]:
      const speakerMatch = line.match(/^\[([^\]]+)\]:/);

      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const color = speaker ? (speakerColors[speaker] ?? 'text-gray-900 dark:text-gray-100') : '';
        const content = line.substring(speakerMatch[0].length).trim();

        return (
          <p key={index} className="mb-3">
            <span className={`font-semibold ${color}`}>[{speaker}]:</span>{' '}
            <span>{content}</span>
          </p>
        );
      }

      // Regular paragraph
      if (line.trim()) {
        return (
          <p key={index} className="mb-3">
            {line}
          </p>
        );
      }

      return null;
    });
  };

  const previewText = transcript.slice(0, 500);
  const hasMore = transcript.length > 500;

  return (
    <div className="w-full max-w-3xl mt-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
      >
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">Full Transcript</span>
        {speakers.length > 0 && (
          <span className="text-sm">
            ({speakers.length} speaker{speakers.length === 1 ? '' : 's'})
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          {/* Speaker legend */}
          {speakers.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              {speakers.map((speaker, index) => (
                <span
                  key={speaker}
                  className={`text-sm font-medium ${SPEAKER_COLORS[index % SPEAKER_COLORS.length]}`}
                >
                  {speaker}
                </span>
              ))}
            </div>
          )}

          {/* Transcript content */}
          <div className="text-sm leading-relaxed max-h-[500px] overflow-y-auto">
            {formatTranscript(transcript)}
          </div>
        </div>
      )}

      {!isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {previewText}
            {hasMore && '...'}
          </p>
        </div>
      )}
    </div>
  );
}
