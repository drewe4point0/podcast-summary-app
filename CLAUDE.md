# Project: Podcast Summary App

A web app for summarizing podcast episodes

---

## Compound Engineering

**Each unit of work should make subsequent work easier, not harder.**

```
Brainstorm → Plan → Work → Review → Compound
```

Use the plugin commands:
- `/workflows:brainstorm` — Explore requirements and approaches before planning
- `/workflows:plan` — Create implementation plans with research agents
- `/workflows:work` — Execute work items systematically with progress tracking
- `/workflows:review` — Run comprehensive code reviews (12+ parallel agents)
- `/workflows:compound` — Document solved problems to compound team knowledge

**IMPORTANT:** After every cycle, run `/workflows:compound` to update the Learnings section below.

---

## Bash Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm build               # Production build

# Verification (YOU MUST run before completing any task)
pnpm typecheck           # TypeScript check
pnpm lint                # ESLint
pnpm test                # Run tests

# Database
pnpm db:start            # Start local Supabase
pnpm db:types            # Regenerate types from schema
```

---

## Code Style

- TypeScript strict mode — never use `any`
- Use `interface` for objects, `type` for unions
- Named exports, not default exports
- Early returns over nested conditionals
- Keep files under 200 lines
- Prefer duplication over premature abstraction

---

## Workflow

1. **Plan first** — Use Plan Mode (shift+tab twice). Go back and forth until the plan is solid. Then switch to auto-accept and execute.

2. **Verify your work** — This is the most important thing. Give Claude a way to verify: run tests, check the browser, use a simulator. Verification improves quality 2-3x.

3. **Commit atomically** — One logical change per commit. Use conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `refactor:` code change that doesn't fix/add
   - `docs:` documentation only

4. **Update CLAUDE.md** — When Claude does something wrong, add it below so it doesn't happen again.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase |
| Styling | Tailwind CSS |
| Validation | Zod |
| Package Manager | pnpm |

---

## Patterns

### API Response
```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

### Zod Validation
```typescript
const schema = z.object({ email: z.string().email() });
const result = schema.safeParse(input);
if (!result.success) return { ok: false, error: result.error.issues[0].message };
```

### Error Handling
```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
```

---

## Structure

```
/src
  /app          # Pages and API routes
  /components   # UI components
  /lib          # Business logic, Supabase client
  /types        # TypeScript types
```

---

## Learnings

**IMPORTANT:** Update this section after every `/workflows:compound`. This is where knowledge compounds.

### What Works
<!-- Document patterns that work well. Format: pattern → why it works -->


### What to Avoid
<!-- Document mistakes so they don't repeat. Format: mistake → correct approach -->


### Reusable Components
<!-- Document components built for reuse. Format: Name → path — description -->


---

## Project Notes

<!-- Add project-specific warnings, gotchas, and critical context here -->