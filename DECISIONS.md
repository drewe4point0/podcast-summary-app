# Engineering Decisions Log

This file tracks all engineering decisions made during development. When decisions change or conflict with previous ones, the change is documented with context.

---

## How to Use This File

**Adding decisions:**
- Add new decisions to the bottom of the relevant category
- Use the next available decision number (e.g., DECISION-007)

**Changing decisions:**
- Mark the old entry's status as `Superseded by DECISION-XXX`
- Add the new decision to the appropriate category
- Add an entry to [Decision Changes](#decision-changes) explaining the change

**Decision format:**

```
### [DECISION-XXX] Short Title
**Date:** YYYY-MM-DD
**Status:** Active | Superseded by DECISION-XXX | Revised
**Context:** Why this decision was needed
**Decision:** What was decided
**Alternatives Considered:** Other options that were discussed
**Consequences:** What this means for the project
```

---

## Categories

- [Architecture](#architecture)
- [APIs & Integrations](#apis--integrations)
- [Database](#database)
- [Authentication](#authentication)
- [UI/UX](#uiux)
- [Tooling & DevOps](#tooling--devops)
- [Third-Party Services](#third-party-services)

---

## Architecture

### [DECISION-001] 3-Stage Chunked Processing Pipeline
**Date:** 2026-01-29
**Status:** Active
**Context:** Needed to decide how to process YouTube transcripts through cleanup and summarization
**Decision:** Use a 3-stage pipeline: Fetch Transcript → Clean Transcript → Generate Summary. Each stage runs independently with its own progress tracking and caching.
**Alternatives Considered:**
- Single-pass processing (one AI call for clean + summarize) — simpler but less flexible
- Queue-based async processing — better for very long podcasts but more infrastructure
**Consequences:** Users can see progress per stage, we can iterate on summary prompts without re-cleaning, intermediate results are cacheable, slightly more API calls

### [DECISION-002] Auto-Detect Speakers with Tool Access
**Date:** 2026-01-29
**Status:** Active
**Context:** Raw transcripts lack speaker identification. Needed to decide how to label speakers in cleaned transcripts.
**Decision:** AI auto-detects speakers using video metadata (title, description, channel) first, with fallback to web search tools when speakers can't be identified from metadata alone.
**Alternatives Considered:**
- User provides speaker names manually — more accurate but worse UX
- Generic labels only (Speaker 1, Speaker 2) — simpler but less useful
**Consequences:** Better user experience, requires web search API integration, may occasionally misidentify speakers

### [DECISION-003] MVP Export: PDF + Email First
**Date:** 2026-01-29
**Status:** Active
**Context:** User requested 4 export options (PDF, email, Google Docs, Notion). Needed to prioritize for MVP.
**Decision:** Build PDF and email export for MVP. Google Docs and Notion integrations deferred to later phase.
**Alternatives Considered:**
- All 4 from start — slower to ship
- PDF only — too minimal
**Consequences:** Faster MVP delivery, OAuth complexity deferred, clear scope for v1

---

## APIs & Integrations

### [DECISION-004] YouTube Transcript API: youtube-transcript.io
**Date:** 2026-01-29
**Status:** Active
**Context:** Need to fetch transcripts from YouTube videos. Multiple services and libraries available.
**Decision:** Use youtube-transcript.io API (user already has account/API key)
**Alternatives Considered:**
- youtube-transcript npm package — free but less reliable
- YouTube Data API — official but doesn't provide transcripts directly
- AssemblyAI — overkill for videos that already have captions
**Consequences:** Paid service dependency, reliable transcript fetching, simple API integration

### [DECISION-005] AI Service: OpenAI GPT-4
**Date:** 2026-01-29
**Status:** Active
**Context:** Need AI for transcript cleanup (formatting, speaker detection) and summarization
**Decision:** Use OpenAI GPT-4 for both transcript cleanup and summary generation
**Alternatives Considered:**
- Anthropic Claude — strong at instructions but user preferred OpenAI
- Multiple providers — unnecessary complexity
**Consequences:** Single AI provider to manage, good long-form text handling, token costs for long podcasts need monitoring

---

## Database

<!-- Schema decisions, indexing strategies, data modeling, etc. -->

---

## Authentication

### [DECISION-006] Optional Authentication with Supabase
**Date:** 2026-01-29
**Status:** Active
**Context:** Needed to decide if users must log in to use the app
**Decision:** Authentication is optional. App works fully without login. Logged-in users get saved history of processed podcasts.
**Alternatives Considered:**
- No auth at all — simpler but no history
- Required auth — barrier to entry for casual users
**Consequences:** Two user paths to handle (anonymous vs authenticated), need to consider data retention for anonymous users

---

## UI/UX

### [DECISION-007] Processing UX: Progress Bar + Optional Email
**Date:** 2026-01-29
**Status:** Active
**Context:** Long podcasts (1-3 hours) need good UX during processing. Users shouldn't wonder if the app is working.
**Decision:** Show a progress bar with stage indicators (Fetching → Cleaning → Summarizing). Users can optionally provide email to be notified when processing completes.
**Alternatives Considered:**
- Real-time streaming only — requires user to keep page open
- Background queue with email only — no immediate feedback
**Consequences:** Need WebSocket or polling for progress updates, optional email integration, good balance of immediate feedback and flexibility

---

## Tooling & DevOps

<!-- Build tools, CI/CD, deployment, local development setup, etc. -->

---

## Third-Party Services

### [DECISION-008] Email Service: Resend
**Date:** 2026-01-29
**Status:** Active
**Context:** Need email service for "send summary via email" feature
**Decision:** Use Resend for transactional emails
**Alternatives Considered:**
- SendGrid — well-established but more complex setup
- Postmark — good deliverability but smaller free tier
**Consequences:** Simple API, generous free tier (3,000/month), modern React email templates supported

### [DECISION-009] PDF Generation: Client-Side with jspdf
**Date:** 2026-01-29
**Status:** Active
**Context:** Need to generate downloadable PDFs of summaries
**Decision:** Use jspdf library to generate PDFs in the browser (client-side)
**Alternatives Considered:**
- Server-side with Puppeteer — more formatting control but requires server resources
- react-pdf — more complex but better for complex layouts
**Consequences:** Simpler setup, works offline, no server load. **FLAG FOR FUTURE:** May need to revisit if PDF formatting needs improve.

### [DECISION-010] Web Search for Speaker ID: Tavily
**Date:** 2026-01-29
**Status:** Active
**Context:** AI may need to search the web to identify podcast speakers when video metadata isn't enough
**Decision:** Use Tavily API for AI-powered web search
**Alternatives Considered:**
- Serper (Google wrapper) — more results but raw data needs parsing
- Skip web search — simpler but less accurate speaker identification
**Consequences:** Better AI-ready search results, 1,000 free searches/month, adds external dependency

### [DECISION-011] Long Podcast Handling: Chunked Processing
**Date:** 2026-01-29
**Status:** Active
**Context:** Long podcasts (2-3 hours) exceed AI token limits
**Decision:** Process transcripts in chunks, then consolidate results
**Alternatives Considered:**
- Limit to short podcasts only — simpler but restricts functionality
- Defer to v2 — faster MVP but incomplete feature
**Consequences:** Supports any length podcast, more complex processing logic, need to handle chunk boundaries carefully

### [DECISION-012] Progress Updates: Simple Polling
**Date:** 2026-01-29
**Status:** Active
**Context:** Need to show processing progress to users during long operations
**Decision:** Use simple polling (page checks status every few seconds)
**Alternatives Considered:**
- WebSocket/SSE real-time streaming — smoother but more complex infrastructure
**Consequences:** Simpler to implement, works everywhere, slight delay in updates (acceptable for MVP)

### [DECISION-013] Tab Close Recovery: Unique Link + Optional Email
**Date:** 2026-01-29
**Status:** Active
**Context:** Long podcasts take minutes to process. Users may close tab.
**Decision:** Generate a unique shareable link before processing starts (user can bookmark). Also optionally collect email for completion notification.
**Alternatives Considered:**
- Email required — adds friction
- Results lost if tab closed — bad UX
**Consequences:** Need to persist jobs in database, generate unique IDs, results accessible via link

### [DECISION-014] Email Export: Summary + PDF Attachment
**Date:** 2026-01-29
**Status:** Active
**Context:** Need to define what "send summary via email" includes
**Decision:** Email contains summary in the body (HTML) AND a PDF attachment of the summary
**Alternatives Considered:**
- Summary only in body — no offline access
- PDF only as attachment — harder to preview
**Consequences:** Email is larger but more useful, need to generate PDF server-side for attachment

### [DECISION-015] Progress Bar: Detailed with Chunk Progress
**Date:** 2026-01-29
**Status:** Active
**Context:** Long podcasts are processed in chunks. Simple "Cleaning" stage could last 10+ minutes.
**Decision:** Show detailed progress including chunk numbers (e.g., "Cleaning transcript: 7/12 chunks")
**Alternatives Considered:**
- Simple 3-stage only — less informative for long content
**Consequences:** Need to track and report chunk progress, better UX for long podcasts

### [DECISION-016] Language Support: English Only for MVP
**Date:** 2026-01-29
**Status:** Active
**Context:** Podcasts exist in many languages
**Decision:** MVP supports English only. Show clear error for non-English content.
**Alternatives Considered:**
- Any language YouTube supports — more complex prompts, testing
**Consequences:** Simpler prompts, limited audience, clear scope for v1

### [DECISION-017] Copy to Clipboard Feature
**Date:** 2026-01-29
**Status:** Active
**Context:** Users may want to copy summary to paste into other apps
**Decision:** Add "Copy to Clipboard" button alongside PDF/Email export options
**Alternatives Considered:**
- Skip for MVP — misses common use case
**Consequences:** Simple to implement, high utility

---

## Decision Changes

This section documents when decisions are revised or superseded, providing context for why changes were made.

<!-- Example:
### [CHANGE-001] Switched from REST to tRPC
**Date:** 2024-02-01
**Supersedes:** DECISION-005 (Use REST API pattern)
**Reason for Change:** Type safety across client/server became a priority
**Impact:** Need to refactor existing API routes
-->
