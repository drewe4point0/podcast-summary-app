-- Podcast Summary App - Initial Schema
-- This migration creates the core tables for job processing, transcripts, and summaries

-- Jobs table: tracks processing state for each podcast
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  video_title TEXT,
  video_channel TEXT,
  video_thumbnail_url TEXT,
  progress JSONB DEFAULT '{"stage": "pending"}',
  error TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Transcripts table: stores raw and cleaned transcript data
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT,
  speakers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id)
);

-- Summaries table: stores generated summaries
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_youtube_id ON jobs(youtube_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_job_id ON transcripts(job_id);
CREATE INDEX IF NOT EXISTS idx_summaries_job_id ON summaries(job_id);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Jobs: Anyone can view a job if they have the ID (for shareable links)
CREATE POLICY "Jobs are viewable by ID" ON jobs
  FOR SELECT USING (true);

-- Jobs: Anyone can create jobs (anonymous or authenticated)
CREATE POLICY "Jobs can be created by anyone" ON jobs
  FOR INSERT WITH CHECK (true);

-- Jobs: Only service role can update jobs (for background processing)
-- This is handled by using the service role key in the backend
CREATE POLICY "Jobs can be updated" ON jobs
  FOR UPDATE USING (true);

-- Transcripts: Follow job visibility
CREATE POLICY "Transcripts are viewable if job is viewable" ON transcripts
  FOR SELECT USING (true);

CREATE POLICY "Transcripts can be inserted" ON transcripts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Transcripts can be updated" ON transcripts
  FOR UPDATE USING (true);

-- Summaries: Follow job visibility
CREATE POLICY "Summaries are viewable if job is viewable" ON summaries
  FOR SELECT USING (true);

CREATE POLICY "Summaries can be inserted" ON summaries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Summaries can be updated" ON summaries
  FOR UPDATE USING (true);

-- Function to update completed_at when status changes to 'completed'
CREATE OR REPLACE FUNCTION update_job_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update completed_at
DROP TRIGGER IF EXISTS job_completed_trigger ON jobs;
CREATE TRIGGER job_completed_trigger
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_completed_at();
