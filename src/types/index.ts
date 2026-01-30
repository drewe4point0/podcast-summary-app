// API Response pattern from CLAUDE.md
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Job status - represents processing stages
export type JobStatus =
  | 'pending'
  | 'fetching'
  | 'cleaning'
  | 'summarizing'
  | 'completed'
  | 'failed';

// Progress information for polling
export interface JobProgress {
  stage: JobStatus;
  current?: number; // Current chunk number
  total?: number; // Total chunks
  message?: string; // Human-readable status
}

// Video metadata from YouTube
export interface VideoMetadata {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  duration?: string;
}

// Job record - tracks processing state
export interface Job {
  id: string;
  status: JobStatus;
  progress: JobProgress;
  youtubeUrl: string;
  youtubeId: string;
  videoMetadata?: VideoMetadata;
  error?: string;
  notificationEmail?: string;
  createdAt: string;
  completedAt?: string;
}

// Transcript data
export interface Transcript {
  jobId: string;
  rawText: string;
  cleanedText?: string;
  speakers?: string[];
}

// Summary data
export interface Summary {
  jobId: string;
  content: string; // Markdown
  promptVersion: string;
}

// Complete job result (returned when job is complete)
export interface JobResult {
  job: Job;
  transcript?: Transcript;
  summary?: Summary;
}

// API request/response types
export interface CreateJobRequest {
  youtubeUrl: string;
  notificationEmail?: string;
}

export interface CreateJobResponse {
  jobId: string;
  shareableUrl: string;
}
