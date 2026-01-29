# Create Linear Issue

User is mid-development and thought of a bug/feature/improvement. Capture it fast so they can keep working.

## Your Goal

Create a complete Linear issue using the `mcp__linear-server__create_issue` tool with:
* **Clear title**
* **TL;DR** of what this is about
* **Current state vs expected outcome**
* **Relevant files** that need touching
* **Risk/notes** if applicable
* **Proper type/priority/effort labels**
* **Team:** IkigaiAi (ID: `2df202ee-8de7-413c-9b6c-e8c607e92e65`)
* **State:** Todo

## How to Get There

**Ask questions to fill gaps** — be concise, respect the user's time. They're mid-flow and want to capture this quickly. Usually need:
* What's the issue/feature
* Current behavior vs desired behavior
* Type (bug/feature/improvement) and priority if not obvious

Keep questions brief. One message with 2-3 targeted questions beats multiple back-and-forths.

**Search for context** only when helpful:
* Web search for best practices if it's a complex feature
* Grep codebase to find relevant files (Max 3)
* Note any risks or dependencies you spot

**Skip what's obvious** — If it's a straightforward bug, don't search web. If type/priority is clear from description, don't ask.

**Keep it fast** — Total exchange under 2min. Be conversational but brief. Get what you need, create ticket, done.

## Behavior Rules

* **Be conversational** — ask what makes sense, not a checklist.
* **Default priority:** normal, **effort:** medium (ask only if unclear).
* **Bullet points** over paragraphs for descriptions.
* **Confirmation:** Once created, provide the Linear link and a brief summary.

---

### Implementation Details for Cursor
* **Tool to use:** `mcp__linear-server__create_issue`.
* **Description Format:** Ensure the description includes sections for **TL;DR**, **Current State**, **Expected Outcome**, and **Context** (files/notes).