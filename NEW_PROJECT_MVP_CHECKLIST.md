# New Project MVP Checklist (1‑Day Build)

Use this checklist to start a brand-new project and ship a working MVP in one day using the Compound Engineering workflow: **Plan → Work → Review → Compound**.

---

## Setting up Cursor (5–10 minutes)
 
- [ x] Open this template folder inside Cursor
- [ x] Open the terminal inside Cursor
- [ x] Start Claude Code (use the same command you normally run): `claude`
- [ x] Ask Claude to clone this repo under a specific project name (eg. 'podcast-transcriber')
    Prompt: Please clone this repo and use it to create a new project named: ____-____-____ 
- [x ] Once it's been cloned, open the project in a new Cursor window and open Claude Code.
- [ x] Add the plugin marketplace:
  ```
  /plugin marketplace add https://github.com/EveryInc/compound-engineering-plugin
  ```
- [ x] Install the plugin:
  ```
  /plugin install compound-engineering
  ```
- [ x] Verify installation (run `/help` and confirm the workflow commands are available)

- [ ] Open CLAUDE.md file and edit the first two lines (Project and Description)

---

## 1) (Optional) Brainstorm the MVP (5–15 minutes)

Use this only if you feel unclear or stuck.

**Slash command:** `/workflows:brainstorm`

## 0) Optional Conversational Guide: Quick Project Snapshot

Fill this in at the start of every project.

- [ ] **App type:** Web / Mobile / CLI / API / Automation (pick one)
- [ ] **Target user:** Who will use it?
- [ ] **Problem:** What pain are you solving?
- [ ] **MVP success (end-of-day):** What must be true by the end of today?
- [ ] **Out of scope today:** What are we explicitly NOT building?

**Prompt:**
```
/workflows:brainstorm [Your app idea in 1-2 sentences] - targeting 1-day MVP
```

- [ ] Requirements explored
- [ ] Key decisions surfaced
- [ ] Ready to plan

---

## 2) Define the Smallest MVP (Compound Plan)

Goal: lock scope before writing lots of details or building anything.

**Slash command:** `/workflows:plan`

**Prompt:**
```
You are my product planner. I need a 1-day MVP.

Ask me 5-8 short questions, then produce:
1) MVP scope (3-6 features max)
2) Required user flow (4-8 steps)
3) Out-of-scope list
4) "Done" criteria (clear tests)
```

- [ ] MVP scope is small (3–6 features)
- [ ] User flow is written out (4–8 steps)
- [ ] Out-of-scope list is explicit
- [ ] “Done” criteria are clear and testable

---

## 3) Detailed PRD (Product Requirements Document) — *MVP Only* (20–45 minutes)

Goal: write down exactly how the MVP should work (without wasting time on out-of-scope features).

- [ ] Write a **detailed PRD for the MVP only** that includes:
  - [ ] **Problem statement** (what’s broken today)
  - [ ] **Target user(s)** and key use cases
  - [ ] **MVP scope** (copy/paste from Step 2)
  - [ ] **User flow(s)** written step-by-step (happy path first)
  - [ ] **Functional requirements** (what the system must do)
  - [ ] **Non-goals / out of scope** (copy/paste from Step 2)
  - [ ] **“Done” / acceptance criteria** (copy/paste from Step 2, expand if needed)
  - [ ] **Edge cases & error states** (what can go wrong, and what should happen)
  - [ ] **Data model / key objects** (simple is fine)
  - [ ] **Integrations & dependencies** (APIs, payments, auth, email, etc.)
  - [ ] **Security/privacy notes** (anything sensitive like passwords, files, PII)
- [ ] Re-read PRD and confirm it still fits the 1-day scope

---

## 4) Choose Design Approach (Optional)

Wireframes help but are not required. Keep it light for a 1‑day MVP.

Pick one:
- [ ] **Option A (Fast):** No wireframes — build from the written flow/PRD
- [ ] **Option B (Clear):** Sketch 2–3 screens for the core MVP flow only (paper, Excalidraw, Figma, etc.)

---

## 5) Create a Build Plan (Compound Plan)

Goal: turn the MVP into small, testable tasks.

**Slash command:** `/workflows:plan`

**Prompt:**
```
Create a step-by-step build plan for the MVP we agreed on.

Requirements:
- 5-12 tasks total
- Each task should be doable in < 2 hours
- Include file structure guidance
- Include a quick test for each task
```

- [ ] Tasks are small and ordered
- [ ] Each task has a quick verification test
- [ ] File structure is suggested
- [ ] Scope still fits in a day

---

## 6) Build the MVP (Compound Work)

Goal: execute one task at a time and keep scope tight.

**Slash command:** `/workflows:work`

**Prompt:**
```
Execute the plan step-by-step.
Work on ONE task at a time.
Explain what you are doing and why in simple language.
After each task, tell me how to verify it worked.
```

Repeat per task:
- [ ] Task completed
- [ ] Task verified (run the test / click the flow / try the command)
- [ ] Scope creep avoided (no “nice-to-haves”)

---

## 7) Review for MVP Gaps (Compound Review)

Goal: find the most important bugs or missing pieces before calling it “done”.

**Slash command:** `/workflows:review`

**Prompt:**
```
Review the code against the MVP "done" criteria.
Focus only on the most important bugs or missing pieces.
List the top priority fixes to reach MVP.
```

- [ ] Critical issues listed
- [ ] Fixes prioritized
- [ ] MVP still within 1-day scope
- [ ] Review notes captured (often in `todos/`)

---

## 8) Fix the Top Issues (Compound Work)

Goal: fix only what’s necessary to hit MVP “done”.

**Slash command:** `/workflows:work`

**Prompt:**
```
Fix only the top priority MVP issues from the review.
Avoid adding new features.
```

- [ ] Top issues fixed
- [ ] No new features added
- [ ] MVP still works end-to-end

---

## 9) Final MVP Test (Manual)

Use your “MVP success” + “Done” criteria.

- [ ] Core user flow works end-to-end
- [ ] MVP success criteria met
- [ ] Nothing essential missing/broken

---

## 10) Capture Learnings (Compound)

Goal: make your next project easier.

**Slash command:** `/workflows:compound`

**Prompt:**
```
Summarize the key learnings:
- What worked well
- What was painful
- Reusable patterns
- What to improve next time
- Suggested updates to this checklist for smoother future MVPs, in TWO parts:
  Part 1) A numbered list of concrete checklist changes.
  Part 2) A ready-to-copy prompt that tells the agent to walk me through each
          suggestion one-by-one, asking me to approve or reject each change.
```

- [ ] Key learnings documented
- [ ] Reusable patterns captured

---

## 11) Update This Checklist (Manual)

- [ ] Apply the approved improvements to this checklist so the next project starts smoother

---

## Quick Reference

### Core Loop

Brainstorm (optional) → Plan (MVP) → PRD (MVP only) → Plan (build tasks) → Work → Review → Fix → Compound → Update checklist

### Essential Commands

- [ ] Brainstorm (optional): `/workflows:brainstorm`
- [ ] Plan: `/workflows:plan`
- [ ] Work: `/workflows:work`
- [ ] Review: `/workflows:review`
- [ ] Learnings: `/workflows:compound`

### Common Output Folders (if your setup uses them)

- [ ] `plans/` (plans)
- [ ] `todos/` (review findings)
- [ ] `docs/solutions/` (learnings/patterns)

---

# Done

You now have a working MVP and a repeatable process.
