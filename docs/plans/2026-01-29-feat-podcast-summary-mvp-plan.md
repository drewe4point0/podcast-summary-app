---
title: Podcast Summary App MVP
type: feat
date: 2026-01-29
---

# Podcast Summary App MVP

## Overview

Build a web app where users paste a YouTube URL (especially podcasts), and the app:
1. Fetches the transcript
2. Cleans it up with AI (including speaker identification)
3. Generates a bullet-point summary
4. Lets users export via PDF, email, or clipboard

**Target users:** Small group of friends/colleagues who want quick podcast summaries.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ URL Input   │→ │ Processing  │→ │ Results     │→ │ Export      │    │
│  │ + Preview   │  │ Progress    │  │ Display     │  │ Options     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API ROUTES (Next.js)                             │
│  POST /api/jobs          - Start processing, return job ID + link        │
│  GET  /api/jobs/[id]     - Poll job status + progress                   │
│  POST /api/export/email  - Send summary via email                       │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      3-STAGE PROCESSING PIPELINE                        │
│                                                                          │
│  Stage 1: FETCH          Stage 2: CLEAN           Stage 3: SUMMARIZE   │
│  ┌──────────────┐       ┌──────────────┐        ┌──────────────┐       │
│  │ youtube-     │       │ OpenAI GPT-4 │        │ OpenAI GPT-4 │       │
│  │ transcript.io│       │ + Tavily     │        │              │       │
│  │              │       │ (speaker ID) │        │              │       │
│  └──────────────┘       └──────────────┘        └──────────────┘       │
│        │                      │                        │                │
│        ▼                      ▼                        ▼                │
│   raw transcript      cleaned transcript          summary              │
│   + video metadata    with speaker labels        (markdown)            │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                               │
│  jobs: id, status, progress, youtube_url, video_metadata                │
│  transcripts: job_id, raw_text, cleaned_text, speakers                 │
│  summaries: job_id, content, prompt_version                            │
│  users: id, email (optional auth)                                       │
│  user_jobs: user_id, job_id (history for logged-in users)              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Project Setup
**Goal:** Get the development environment running with all dependencies.

#### 1.1 Initialize Next.js Project
```bash
pnpm create next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Files created:**
- `package.json`
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

#### 1.2 Install Dependencies
```bash
# Core
pnpm add @supabase/supabase-js openai zod

# PDF generation (client-side)
pnpm add jspdf

# Email (for PDF attachment, need server-side generation too)
pnpm add resend @react-email/components

# Utilities
pnpm add nanoid   # For generating job IDs

# Dev
pnpm add -D @types/node
```

#### 1.3 Configure TypeScript Strict Mode
Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 1.4 Set Up Environment Variables
Create `.env.local`:
```
# YouTube Transcript API
YOUTUBE_TRANSCRIPT_API_KEY=your_key_here

# OpenAI
OPENAI_API_KEY=your_key_here

# Tavily (web search for speaker ID)
TAVILY_API_KEY=your_key_here

# Resend (email)
RESEND_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

#### 1.5 Create Core Types
**File: `src/types/index.ts`**
```typescript
// API Response pattern from CLAUDE.md
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Job status
export type JobStatus = 'pending' | 'fetching' | 'cleaning' | 'summarizing' | 'completed' | 'failed';

export interface Job {
  id: string;
  status: JobStatus;
  progress: {
    stage: JobStatus;
    current?: number;  // Current chunk
    total?: number;    // Total chunks
    message?: string;
  };
  youtubeUrl: string;
  videoMetadata?: VideoMetadata;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  duration?: string;
}

export interface Transcript {
  jobId: string;
  rawText: string;
  cleanedText?: string;
  speakers?: string[];
}

export interface Summary {
  jobId: string;
  content: string;  // Markdown
  promptVersion: string;
}
```

#### 1.6 Create Utility Functions
**File: `src/lib/utils.ts`**
```typescript
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function extractYouTubeId(url: string): string | null {
  // Supports: youtube.com/watch?v=, youtu.be/, m.youtube.com, etc.
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/  // Just the ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
```

#### 1.7 Set Up Supabase Client
**File: `src/lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**File: `src/lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

---

### Phase 2: Database Schema
**Goal:** Create the Supabase tables to store jobs, transcripts, and summaries.

#### 2.1 Create Database Migration
**File: `supabase/migrations/001_initial_schema.sql`**
```sql
-- Jobs table: tracks processing state
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  video_title TEXT,
  video_channel TEXT,
  video_thumbnail_url TEXT,
  progress JSONB DEFAULT '{}',
  error TEXT,
  user_id UUID REFERENCES auth.users(id),
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Transcripts table
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT,
  speakers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Policies: Jobs are publicly readable by ID (for shareable links)
CREATE POLICY "Jobs are viewable by anyone with the ID" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Jobs can be created by anyone" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Jobs can be updated by service role" ON jobs
  FOR UPDATE USING (true);

-- Transcripts/Summaries follow job access
CREATE POLICY "Transcripts viewable if job is viewable" ON transcripts
  FOR SELECT USING (true);

CREATE POLICY "Summaries viewable if job is viewable" ON summaries
  FOR SELECT USING (true);
```

#### 2.2 Generate TypeScript Types
```bash
pnpm db:types
```

This creates `src/types/database.ts` with typed table definitions.

---

### Phase 3: Core API Routes
**Goal:** Build the API endpoints for starting jobs and checking status.

#### 3.1 POST /api/jobs - Start Processing
**File: `src/app/api/jobs/route.ts`**

Accepts YouTube URL, validates it, creates job record, returns job ID and shareable link.

```typescript
// Pseudo-structure
export async function POST(request: Request) {
  // 1. Parse and validate request body (Zod)
  // 2. Extract YouTube video ID
  // 3. Fetch video metadata (title, thumbnail) via oEmbed
  // 4. Generate unique job ID (nanoid)
  // 5. Insert job into Supabase
  // 6. Start background processing (see Phase 4)
  // 7. Return { jobId, shareableUrl }
}
```

#### 3.2 GET /api/jobs/[id] - Check Status
**File: `src/app/api/jobs/[id]/route.ts`**

Returns current job status, progress, and results if complete.

```typescript
// Pseudo-structure
export async function GET(request: Request, { params }) {
  // 1. Fetch job from Supabase by ID
  // 2. If not found, return 404
  // 3. If complete, include transcript and summary
  // 4. Return job data with progress info
}
```

#### 3.3 Validation Schemas
**File: `src/lib/validation.ts`**
```typescript
import { z } from 'zod';

export const createJobSchema = z.object({
  youtubeUrl: z.string().url().refine(
    (url) => extractYouTubeId(url) !== null,
    { message: 'Invalid YouTube URL' }
  ),
  notificationEmail: z.string().email().optional(),
});

export const jobIdSchema = z.object({
  id: z.string().min(1),
});
```

---

### Phase 4: Processing Pipeline
**Goal:** Implement the 3-stage processing (fetch → clean → summarize).

#### 4.1 Stage 1: Fetch Transcript
**File: `src/lib/pipeline/fetch-transcript.ts`**

```typescript
// Pseudo-structure
export async function fetchTranscript(youtubeId: string): Promise<Result<string>> {
  // 1. Call youtube-transcript.io API
  // 2. Handle errors (no captions, private video, etc.)
  // 3. Return raw transcript text
}
```

**Error handling:**
- No captions available → Return clear error message
- API rate limit → Retry with backoff (3 attempts)
- Private/unavailable video → Return specific error

#### 4.2 Stage 2: Clean Transcript
**File: `src/lib/pipeline/clean-transcript.ts`**

```typescript
// Pseudo-structure
export async function cleanTranscript(
  rawText: string,
  videoMetadata: VideoMetadata,
  onProgress: (current: number, total: number) => void
): Promise<Result<{ cleanedText: string; speakers: string[] }>> {
  // 1. Calculate chunk count based on token limits (~8000 tokens/chunk)
  // 2. For each chunk:
  //    a. Send to OpenAI with prompt for formatting + speaker detection
  //    b. If speaker unknown, call Tavily for web search
  //    c. Report progress via callback
  // 3. Merge chunks, deduplicate speaker labels
  // 4. Return cleaned transcript with speaker list
}
```

**Chunking strategy:**
- ~8,000 tokens per chunk (leaves room for prompt + response)
- 500 token overlap between chunks for context
- Include video metadata (title, channel) in each chunk's prompt

**Speaker identification prompt (simplified):**
```
You are formatting a podcast transcript. The podcast is "{title}" from "{channel}".

Format the transcript with speaker labels like:
[Speaker Name]: What they said...

Use the video title and description to identify speakers. If you can't identify someone, use "Speaker 1", "Speaker 2", etc.

Preserve the exact wording - do not summarize or paraphrase.
```

#### 4.3 Stage 3: Summarize
**File: `src/lib/pipeline/summarize.ts`**

```typescript
// Pseudo-structure
export async function summarize(
  cleanedText: string,
  videoMetadata: VideoMetadata
): Promise<Result<string>> {
  // 1. Send cleaned transcript to OpenAI
  // 2. Prompt for bullet-point summary with key insights
  // 3. Return markdown summary
}
```

**Summary prompt (v1 - will iterate):**
```
Summarize this podcast transcript into key bullet points.

Include:
- Main topics discussed
- Key insights or takeaways
- Notable quotes (with speaker attribution)
- Any action items or recommendations mentioned

Keep it concise but comprehensive. Use markdown formatting.
```

#### 4.4 Pipeline Orchestrator
**File: `src/lib/pipeline/process-job.ts`**

```typescript
// Pseudo-structure
export async function processJob(jobId: string) {
  // 1. Update job status to 'fetching'
  // 2. Call fetchTranscript()
  // 3. Update job status to 'cleaning', save raw transcript
  // 4. Call cleanTranscript() with progress callback
  // 5. Update job status to 'summarizing', save cleaned transcript
  // 6. Call summarize()
  // 7. Update job status to 'completed', save summary
  // 8. If notification email provided, send completion email
  // 9. On any error: update job status to 'failed', save error message
}
```

---

### Phase 5: User Interface
**Goal:** Build the frontend pages and components.

#### 5.1 Landing Page / URL Input
**File: `src/app/page.tsx`**

Components:
- URL input field with validation
- "Process" button
- Video preview card (shows after URL validation)
- Optional email input for notifications

#### 5.2 Processing Page
**File: `src/app/job/[id]/page.tsx`**

Components:
- Progress bar with stage indicators
- Chunk progress (e.g., "Cleaning: 7/12")
- Shareable link display (for bookmarking)
- "Add email for notification" option

#### 5.3 Results Page (same as Processing, but complete)
**File: `src/app/job/[id]/page.tsx`**

Components:
- Summary display (rendered markdown)
- Cleaned transcript (expandable/collapsible)
- Export buttons: Copy, PDF, Email
- "Process another" link

#### 5.4 Component List
**Files in `src/components/`:**
- `url-input.tsx` - URL input with validation
- `video-preview.tsx` - Thumbnail, title, channel
- `progress-bar.tsx` - Multi-stage progress indicator
- `summary-display.tsx` - Markdown renderer
- `transcript-viewer.tsx` - Expandable transcript with speaker colors
- `export-buttons.tsx` - Copy, PDF, Email buttons
- `email-modal.tsx` - Modal for entering email address

---

### Phase 6: Export Features
**Goal:** Implement PDF download, email sending, and clipboard copy.

#### 6.1 Copy to Clipboard
**File: `src/components/export-buttons.tsx`**

```typescript
// Use navigator.clipboard.writeText()
// Show toast notification on success
```

#### 6.2 PDF Download (Client-Side)
**File: `src/lib/export/generate-pdf.ts`**

```typescript
// Use jspdf to create PDF
// Include: video title, channel, date, summary
// Style: clean, readable formatting
```

#### 6.3 Email Export
**File: `src/app/api/export/email/route.ts`**

```typescript
// 1. Generate PDF server-side (for attachment)
// 2. Send via Resend with:
//    - Summary in HTML body
//    - PDF attached
// 3. Return success/error
```

**Email template:**
- Subject: "Podcast Summary: {video title}"
- Body: Summary formatted as HTML
- Attachment: PDF of summary

---

### Phase 7: Optional Authentication
**Goal:** Add Supabase Auth for users who want saved history.

#### 7.1 Auth UI
- Login/signup modal (email + password, or magic link)
- User menu in header (when logged in)

#### 7.2 History Page
**File: `src/app/history/page.tsx`**

- List of user's past summaries
- Sorted by date (newest first)
- Click to view full results
- Delete option

#### 7.3 Link Jobs to Users
- When logged in, associate new jobs with user ID
- On job completion, auto-save to history

---

## File Structure (Final)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page with URL input
│   ├── job/
│   │   └── [id]/
│   │       └── page.tsx            # Processing + Results page
│   ├── history/
│   │   └── page.tsx                # User's past summaries
│   └── api/
│       ├── jobs/
│       │   ├── route.ts            # POST - create job
│       │   └── [id]/
│       │       └── route.ts        # GET - job status
│       └── export/
│           └── email/
│               └── route.ts        # POST - send email
├── components/
│   ├── url-input.tsx
│   ├── video-preview.tsx
│   ├── progress-bar.tsx
│   ├── summary-display.tsx
│   ├── transcript-viewer.tsx
│   ├── export-buttons.tsx
│   └── email-modal.tsx
├── lib/
│   ├── utils.ts
│   ├── validation.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── pipeline/
│   │   ├── fetch-transcript.ts
│   │   ├── clean-transcript.ts
│   │   ├── summarize.ts
│   │   └── process-job.ts
│   └── export/
│       └── generate-pdf.ts
└── types/
    ├── index.ts
    └── database.ts                 # Generated from Supabase
```

---

## Acceptance Criteria

### Core Flow
- [ ] User can paste YouTube URL and see video preview
- [ ] User can start processing and see progress bar with chunk details
- [ ] User receives shareable link before processing starts
- [ ] Processing completes with summary and cleaned transcript
- [ ] User can copy summary to clipboard
- [ ] User can download summary as PDF
- [ ] User can email summary (with PDF attachment)

### Error Handling
- [ ] Invalid URL shows clear error message
- [ ] Video without captions shows specific error
- [ ] API failures retry 3 times before failing
- [ ] Failed jobs show error message with retry option

### Quality
- [ ] Passes `pnpm typecheck`
- [ ] Passes `pnpm lint`
- [ ] Passes `pnpm test` (unit tests for utilities)
- [ ] Works on mobile browsers
- [ ] PDF downloads work on iOS/Android

### Optional Auth
- [ ] Users can sign up / log in
- [ ] Logged-in users see history of past summaries
- [ ] Users can delete items from history

---

## Open Questions (Deferred)

These are explicitly deferred to post-MVP:
- Google Docs export
- Notion export
- Non-English podcast support
- User-editable summaries before export
- Custom summary templates
- Audio file upload (non-YouTube sources)

---

## References

- Brainstorm: `docs/brainstorms/2026-01-29-podcast-summary-app-brainstorm.md`
- Decisions: `DECISIONS.md` (17 decisions documented)
- Project conventions: `CLAUDE.md`
