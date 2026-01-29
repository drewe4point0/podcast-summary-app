---
date: 2026-01-29
topic: podcast-summary-app
---

# Podcast Summary App

## What We're Building

A web app where users can:
1. Input a YouTube URL (especially podcasts)
2. Fetch the transcript via youtube-transcript.io API
3. Clean up the transcript with AI, including auto-detecting and labeling speakers
4. Generate a bullet-point summary from the cleaned transcript
5. Export the summary (PDF, email now; Google Docs, Notion later)

**Target users:** Small group of colleagues/friends who want quick podcast summaries.

**Authentication:** Optional login—works without it, but logged-in users get saved history.

## Why This Approach

We chose the **Chunked Processing Pipeline** architecture:

```
YouTube URL → Fetch Transcript → Clean Transcript → Generate Summary → Export
                    ↓                   ↓                  ↓
              (raw text)        (formatted with       (bullet points)
                                speaker labels)
```

**Rationale:**
- Each stage can be cached independently
- Progress bar shows meaningful stages to users
- Can iterate on summary prompt without re-cleaning transcript
- Easier to debug when something fails

Alternative considered: Single-pass processing (simpler but less flexible).

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transcript API | youtube-transcript.io | User already signed up |
| AI Service | OpenAI (GPT-4) | User preference, good at long-form text |
| Architecture | 3-stage pipeline | Flexibility to iterate on prompts, clear progress |
| Speaker ID | Auto-detect + lookup | AI uses video metadata + web search to identify speakers |
| Auth | Optional (Supabase) | Works without login, history for logged-in users |
| Export MVP | PDF + Email | Start simple, add Google Docs/Notion later |
| Processing UX | Progress bar + optional email | Users see progress, can opt for notification |

## Core User Flow

1. User pastes YouTube URL
2. App validates URL, shows video title/thumbnail as confirmation
3. User clicks "Process"
4. Progress bar shows: Fetching → Cleaning → Summarizing
5. Results displayed: Summary (primary), Full Cleaned Transcript (secondary/expandable)
6. Export buttons: Download PDF, Send Email
7. (If logged in) Saved to history

## Data Model (Supabase)

```
users (optional auth)
├── id, email, created_at

videos
├── id, youtube_url, youtube_id, title, channel, thumbnail_url
├── user_id (nullable), created_at

transcripts
├── id, video_id
├── raw_text, cleaned_text, speakers (jsonb)
├── created_at

summaries
├── id, transcript_id
├── content (markdown), prompt_version
├── created_at
```

## Technical Approach

### Stage 1: Fetch Transcript
- Call youtube-transcript.io API with video ID
- Store raw transcript text
- Also fetch video metadata (title, description, channel) via YouTube oEmbed or Data API

### Stage 2: Clean Transcript
- Send transcript to OpenAI in chunks (handle token limits)
- Prompt includes: format with speaker labels, preserve exact wording
- AI uses video metadata as context for speaker identification
- If speakers can't be identified from metadata, AI can request web search
- Output: formatted transcript with `[Speaker Name]: dialogue` format

### Stage 3: Summarize
- Send cleaned transcript to OpenAI
- Prompt: generate bullet-point summary with key insights
- Prompt is configurable (will iterate to find what works best)
- Output: markdown summary

### Export
- **PDF:** Generate client-side or server-side PDF from summary markdown
- **Email:** Send via email service (Resend, SendGrid, etc.)
- **Later:** Google Docs API, Notion API

## Open Questions

1. **Token limits:** How to handle 3-hour podcasts that exceed context windows?
   - Likely: Process in chunks, then consolidate

2. **Web search for speakers:** Which service? Tavily, Serper, or built-in OpenAI browsing?
   - Need to research options

3. **Email service:** Resend vs SendGrid vs Postmark?
   - Decision for planning phase

4. **PDF generation:** Client-side (jspdf) vs server-side (puppeteer)?
   - Trade-off: client is simpler, server handles complex formatting better

## Out of Scope (for now)

- Google Docs export
- Notion export
- Audio file upload (non-YouTube sources)
- Real-time collaborative editing
- Custom summary templates

## Next Steps

→ `/workflows:plan` for implementation details
