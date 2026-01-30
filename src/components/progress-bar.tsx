'use client';

import type { JobProgress, JobStatus } from '@/types';

interface ProgressBarProps {
  progress: JobProgress;
  status: JobStatus;
}

const STAGES: { key: JobStatus; label: string }[] = [
  { key: 'fetching', label: 'Fetching' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'summarizing', label: 'Summarizing' },
];

function getStageIndex(status: JobStatus): number {
  const index = STAGES.findIndex((s) => s.key === status);
  if (status === 'completed') return STAGES.length;
  if (status === 'failed' || status === 'pending') return -1;
  return index;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  const currentStageIndex = getStageIndex(status);
  const isFailed = status === 'failed';
  const isComplete = status === 'completed';

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Stage indicators */}
      <div className="flex justify-between">
        {STAGES.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          const isCurrent = stage.key === progress.stage;

          return (
            <div key={stage.key} className="flex flex-col items-center flex-1">
              {/* Circle indicator */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-colors duration-300
                  ${
                    isCompleted || isComplete
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : isFailed && isCurrent
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }
                `}
              >
                {isCompleted || isComplete ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-sm font-medium
                  ${isActive || isCompleted || isComplete ? 'text-black dark:text-white' : 'text-gray-400'}
                `}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`
            absolute left-0 top-0 h-full transition-all duration-500 ease-out
            ${isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-black dark:bg-white'}
          `}
          style={{
            width: isComplete
              ? '100%'
              : `${((currentStageIndex + 1) / (STAGES.length + 1)) * 100}%`,
          }}
        />
      </div>

      {/* Status message */}
      <div className="text-center">
        <p className={`font-medium ${isFailed ? 'text-red-600' : ''}`}>
          {progress.message || getDefaultMessage(status)}
        </p>
        {progress.current !== undefined && progress.total !== undefined && (
          <p className="text-sm text-gray-500 mt-1">
            Chunk {progress.current} of {progress.total}
          </p>
        )}
      </div>
    </div>
  );
}

function getDefaultMessage(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'Starting...';
    case 'fetching':
      return 'Fetching transcript from YouTube...';
    case 'cleaning':
      return 'Formatting transcript...';
    case 'summarizing':
      return 'Generating summary...';
    case 'completed':
      return 'Summary ready!';
    case 'failed':
      return 'Processing failed';
    default:
      return 'Processing...';
  }
}
