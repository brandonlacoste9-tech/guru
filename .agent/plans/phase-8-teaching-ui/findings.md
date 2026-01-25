# Guru Teaching Knowledge Base

<!--
  WHAT: Contextual memory of the "Teaching UI" project.
  WHY: Captures learned patterns, failures, and technical decisions.
  WHEN: Updated after every 2 research actions (2-Action Rule).
-->

## Discovered Failure Patterns

### Pattern: [Name]

- **Frequency:** [How often]
- **Root Cause:** [Why it fails]
- **Symptoms:** [Observable signs]
- **Known Fixes:** [Solutions that work]

## Browser Automation Discoveries

- **Element Selectors:** [Working selectors]
- **Timing Issues:** [Wait strategies]
- **State Management:** [Session handling]

## Technical Decisions

### Decision: Guru Automation Schema (v1)

- **Context:** Need a persistent format for recording user actions.
- **Chosen:** Pydantic models mirroring `browser-use` primitives (`Navigate`, `Click`, `Type`, etc.).
- **Rationale:** Ensures 1:1 compatibility with the execution engine. Defined in `apps/api/src/schemas/guru_automation.py`.
- **Outcome:** Ready for Phase 3 (Backend Implementation).

### Decision: Guru Memory System (v1)

- **Context:** Autonomous agents need to persist knowledge and plans across multiple runs.
- **Chosen:** Markdown-based memory (`findings.md`, `task_plan.md`) stored in `memory/guru-{id}/`.
- **Rationale:** Human-readable, easy for LLMs to update, and follows the `planning-with-files` pattern. Injected into `systemPrompt` via `GuruExecutorService`.
- **Outcome:** Successfully implemented in `GuruExecutorService.ts` and `aiService.ts`.

### Decision: CopilotKit Integration

- **Context:** Users need an intelligent assistant during Guru creation.
- **Chosen:** `@copilotkit/react-core`, `@copilotkit/react-ui`, and `@copilotkit/runtime`.
- **Rationale:** Provides a ready-made AI assistant UI and runtime bridge.
- **Outcome:** Integrated into `RootLayout`, `CopilotWrapper`, and new `copilotRoutes.ts`.

## Strategic Brainstorming (Phase 2)

### Pivot: "Customize Your Guru" Platform (The $5B Vision)

- **Decision:** Shift from pre-built gurus to a Guru Factory framework.
- **Why:** Infinite scale, user empowerment, massive marketplace potential.
- **Core Components:**
  1. **Guru Wrapper (`guru.py`):** Configurable personality, voice, and triggers.
  2. **Orchestrator (`guru_orchestrator.py`):** Executes any Guru using existing `planning-with-files` and `self-healing`.
  3. **Builder UI:** "Teach" mode + "Copilot" wizard.
  4. **Marketplace:** Shareable `GuruTemplates`.
- **Integration:** Builds directly on our "Legendary Arsenal" (Browser-Use, Planning, Antigravity Manager).

## Initial Discovery (Phase 1)

- **Antigravity Arsenal Integration (Status: Active)**
  - **Memory:** `planning-with-files` logic ported to Node.js services (Memory System v1).
  - **Reasoning:** `DeepSeek V3` (primary) + `Gemini 1.5 Flash` (fallback) orchestration in `aiService.ts`.
  - **Interface:** `CopilotKit` integrated for builder assistance.
  - **Design:** `UI-UX Pro Max` patterns (Bento Grid, Glassmorphism) applied to `gurus/create/page.tsx`.
  - **Execution:** `browser-use` sidecar hardening with tool-based fractional actions.

## Issues Encountered

<!--
  WHAT: Problems you ran into and how you solved them.
  WHY: Similar to errors in task_plan.md, but focused on broader issues (not just code errors).
  WHEN: Document when you encounter blockers or unexpected challenges.
  EXAMPLE:
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- Errors and how they were resolved -->

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

<!--
  WHAT: URLs, file paths, API references, documentation links you've found useful.
  WHY: Easy reference for later. Don't lose important links in context.
  WHEN: Add as you discover useful resources.
  EXAMPLE:
    - Python argparse docs: https://docs.python.org/3/library/argparse.html
    - Project structure: src/main.py, src/utils.py
-->

## <!-- URLs, file paths, API references -->

## Visual/Browser Findings

<!--
  WHAT: Information you learned from viewing images, PDFs, or browser results.
  WHY: CRITICAL - Visual/multimodal content doesn't persist in context. Must be captured as text.
  WHEN: IMMEDIATELY after viewing images or browser results. Don't wait!
  EXAMPLE:
    - Screenshot shows login form has email and password fields
    - Browser shows API returns JSON with "status" and "data" keys
-->
<!-- CRITICAL: Update after every 2 view/browser operations -->

## <!-- Multimodal content must be captured as text immediately -->

---

<!--
  REMINDER: The 2-Action Rule
  After every 2 view/browser/search operations, you MUST update this file.
  This prevents visual information from being lost when context resets.
-->

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
