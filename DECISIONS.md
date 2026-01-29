# Engineering Decisions Log

This file tracks all engineering decisions made during development. When decisions change or conflict with previous ones, the change is documented with context.

---

## How to Use This File

Each decision follows this format:

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

## Decisions

<!-- Add new decisions at the top of this section -->

<!-- Example:
### [DECISION-001] Use Supabase for Database
**Date:** 2024-01-15
**Status:** Active
**Context:** Need a database with auth, real-time, and easy setup
**Decision:** Use Supabase as the backend database and auth provider
**Alternatives Considered:** Firebase, PlanetScale, raw PostgreSQL
**Consequences:** Ties us to Supabase ecosystem, but provides auth + db + realtime in one
-->

---

## Decision Changes

<!-- Document when decisions are revised or superseded -->

<!-- Example:
### [CHANGE-001] Switched from REST to tRPC
**Date:** 2024-02-01
**Supersedes:** DECISION-005 (Use REST API pattern)
**Reason for Change:** Type safety across client/server became a priority
**Impact:** Need to refactor existing API routes
-->
