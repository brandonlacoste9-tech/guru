# Task Plan: Arsenal Integration & Guru Enhancement

## Goal
Integrate the 7 strategic AI repositories (The Arsenal) into FloGuru to enhance the AI agent's capabilities, UI/UX, and architectural robustness.

## Phases

### Phase 1: Browser-Use & Sidecar Hardening
- [ ] Implement robust connection handling between Node.js `aiService` and Python `main.py`.
- [ ] Add "Session Persistence" to the Python sidecar (keeping browser open across multiple agent steps).
- [ ] Implement `browser-use`'s "multi-tab" and "vision" capabilities if supported.

### Phase 2: Planning-with-Files (Memory System)
- [ ] Create a `memory/` directory for each active Guru.
- [ ] Implement a system where the Guru updates its own `guru_memory.md` and `guru_findings.md` during autonomous runs.
- [ ] Use these files as context for future runs (Long-term Memory).

### Phase 3: Antigravity-Manager Integration (API Proxy)
- [ ] Implement the "Thinking Interruption Defense" from Antigravity-Manager in `aiService.ts`.
- [ ] Add model rotation logic (e.g., if DeepSeek 429s, fallback to Gemini with the same context).
- [ ] Add "Prompt Compression" (Layer 3 strategy) for long-running automations.

### Phase 4: UI-UX Pro Max (Design System)
- [ ] Update `tailwind.config.ts` with a custom "Glassmorphism" theme.
- [ ] Redesign `ActiveGuruCard.tsx` using premium components.
- [ ] Implement the "Teaching UI" with a modern, high-contrast dark theme.

### Phase 5: CopilotKit (The Teaching Assistant)
- [ ] Install `@copilotkit/react-core` and `@copilotkit/react-ui`.
- [ ] Add a `CopilotSidebar` to the builder page to help users define Guru missions and tasks.
- [ ] Implement "Action Injection" so the Copilot can trigger browser recordings for the user.

## Technical Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown-based memory | Human-readable, easy for LLMs to parse, persistent across restarts. | Pending |
| Local Sidecar Proxy | Decouples browser logic from API logic, allows separate scaling. | Adopted |

## Verification Criteria
- [ ] Sidecar survives 10+ navigation steps without crashing.
- [ ] Guru remembers a detail from Run A and uses it in Run B.
- [ ] UI achieves 90+ score in a visual audit.
