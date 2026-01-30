# FloGuru Project Snapshot

**Generated**: 2026-01-29  
**Purpose**: Complete technical summary for rebuilding/continuing the FloGuru project

---

## 1. PROJECT OVERVIEW

### What is FloGuru?

**FloGuru** is an AI-powered life automation platform built around smart "Guru" agents. Each Guru is a specialized AI assistant that can actually DO things - browse the web, fill forms, book appointments, research, automate workflows, and more.

**Core Concept**: 
- **Guru** = The FloGuru AI agent (NOT "MaX" or "Clawdbot" - those are components)
- **Guru** is powered by advanced LLMs (DeepSeek, Gemini, Claude) as the reasoning engine
- **Guru** uses browser-use library for web automation
- **Guru** has access to 222+ specialized skills and tools
- **Guru** learns and improves through HyperHealing technology

### Current Status

**Phase**: MVP/Production Hybrid
- ✅ Core architecture implemented
- ✅ Database schema complete (16+ tables)
- ✅ API endpoints functional
- ✅ Browser automation working (Phase 1 session persistence implemented)
- ✅ Guru execution system operational
- ✅ Chat integrations (Telegram, WhatsApp, Discord) via guru-gateway
- ⚠️ Frontend partially complete (Dashboard, Builder, Teaching UI done; Marketplace views pending)
- ⚠️ Python sidecar requires environment setup

### Tech Stack Summary

**Backend**:
- Node.js + TypeScript + Express
- Drizzle ORM + PostgreSQL (Supabase)
- AI SDK (Vercel AI SDK v6.0.48)
- BullMQ + Redis (optional, for job queues)
- Socket.io (real-time updates)

**Frontend**:
- Next.js 16.1.4
- React + TypeScript
- Tailwind CSS

**Browser Automation**:
- Python 3.11+ + browser-use library (v0.11.4)
- FastAPI sidecar (port 8001)
- Playwright/CDP for browser control

**AI Providers**:
- DeepSeek (primary reasoning)
- Google Gemini (fallback, assessment)
- Anthropic Claude (via LangChain, optional)

**Infrastructure**:
- Supabase (PostgreSQL + Auth)
- Redis (optional, for queues)
- Railway/Vercel (deployment)

### Channels Supported

- **Web**: Next.js frontend (primary interface)
- **WhatsApp**: Via guru-gateway (WebSocket + Baileys)
- **Telegram**: Via guru-gateway (Grammy bot)
- **Discord**: Via guru-gateway (Discord.js)
- **API**: REST endpoints for programmatic access

---

## 2. ARCHITECTURE

### System Architecture

```mermaid
graph TB
    User[User] -->|HTTP/WebSocket| API[FloGuru API<br/>Express + Node.js]
    User -->|WhatsApp/Telegram/Discord| Gateway[Guru Gateway<br/>WebSocket Server]
    
    Gateway -->|JSON Payload| Bridge[BrowserUseBridge<br/>Python Process]
    Bridge -->|browser-use| Browser[Browser Automation<br/>Playwright/CDP]
    
    API -->|REST| Executor[GuruExecutorService]
    Executor -->|LLM Calls| AIService[AIService<br/>DeepSeek/Gemini]
    Executor -->|Tools| BrowserTools[Browser Tools<br/>browse_the_web]
    
    BrowserTools -->|HTTP| Sidecar[Python Sidecar<br/>FastAPI :8001]
    Sidecar -->|Session Registry| BrowserSession[BrowserSession<br/>Persistent]
    
    AIService -->|Tool Calls| MemoryTools[Memory Tools<br/>save_finding]
    AIService -->|Tool Calls| ExpertTools[Expert Tools<br/>222+ Skills]
    
    Executor -->|Database| DB[(Supabase PostgreSQL)]
    Executor -->|Real-time| Socket[Socket.io<br/>Status Updates]
    
    Executor -->|Self-Healing| HyperHealing[HyperHealingOrchestrator]
    HyperHealing -->|Solutions| SolutionsDB[(Automation Solutions)]
```

### Data Flow: User Message → Guru → browser-use → Action → Response

```mermaid
sequenceDiagram
    participant User
    participant API as FloGuru API
    participant Executor as GuruExecutorService
    participant AI as AIService
    participant Tools as Browser Tools
    participant Sidecar as Python Sidecar
    participant Browser as browser-use
    
    User->>API: POST /api/gurus/:id/execute<br/>{taskDescription: "Search Google..."}
    API->>Executor: executeGuruAutomation(guruId, task)
    Executor->>Executor: Build personality prompt
    Executor->>AI: getSelfAssessment(task, guru)
    AI-->>Executor: Assessment (skill_sufficiency, complexity)
    Executor->>AI: executeReasoning(systemPrompt, userPrompt, tools)
    AI->>Tools: browse_the_web({task, max_steps, headless})
    Tools->>Sidecar: executeWithSession(sessionId, task)
    Sidecar->>Browser: Agent.run(task)
    Browser->>Browser: Navigate, Click, Extract
    Browser-->>Sidecar: History + Results
    Sidecar-->>Tools: ExecuteResponse
    Tools-->>AI: {success, summary, content, meta}
    AI-->>Executor: {text, toolCalls, usage}
    Executor->>DB: Log execution
    Executor->>Socket: Emit status update
    Executor-->>API: ExecutionResult
    API-->>User: {success, data, error}
```

### Key Integrations

**1. Supabase (Database + Auth)**
- PostgreSQL database with Drizzle ORM
- User authentication via Supabase Auth
- Service role key for admin operations

**2. browser-use Library**
- Python library for AI-powered browser automation
- Uses CDP (Chrome DevTools Protocol)
- Supports headless and headed modes
- Cloud browser option available

**3. LLM Providers**
- **DeepSeek**: Primary reasoning engine (deepseek-chat model)
- **Google Gemini**: Fallback + assessment (gemini-1.5-flash-latest)
- **Anthropic Claude**: Available via LangChain (optional)

**4. Redis (Optional)**
- BullMQ for job queues
- Only enabled if `ENABLE_REDIS=true`
- Falls back to in-memory execution if disabled

**5. Socket.io**
- Real-time status updates during execution
- WebSocket connection for progress tracking
- Used by frontend for live updates

---

## 3. GURU AGENT SYSTEM

### How Guru is Implemented

**Guru** is not a single class or file - it's a **system** composed of:

1. **Guru Definition** (Database): Stored in `gurus` table with personality, category, system prompt
2. **Guru Executor** (`guruExecutorService.ts`): Orchestrates task execution
3. **AI Service** (`aiService.ts`): Handles LLM reasoning and tool calling
4. **Personality System**: Custom system prompts based on guru personality traits
5. **Skill Router**: Selects domain-specific tools for each guru
6. **Cognitive Engine**: Pre-execution assessment and decision-making

### LLM Integration

**Primary Model**: DeepSeek Chat
- Provider: `@ai-sdk/openai` (OpenAI-compatible API)
- Base URL: `https://api.deepseek.com`
- Model: `deepseek-chat`
- Used for: Main reasoning, tool calling, multi-step planning

**Fallback Model**: Google Gemini
- Provider: `@ai-sdk/google`
- Model: `gemini-1.5-flash-latest`
- Used for: Fast assessment, fallback when DeepSeek fails

**Assessment Model**: Gemini Flash
- Used for: Pre-execution self-assessment (skill_sufficiency, task_complexity, etc.)
- Faster/cheaper than DeepSeek for metadata extraction

**Code Location**: `apps/api/src/services/aiService.ts`

```typescript
// DeepSeek initialization
private get deepseek() {
  if (!this._deepseek) {
    this._deepseek = createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      fetch: deepseekFetch,
      compatibility: "strict",
    } as any);
  }
  return this._deepseek;
}

// Google Gemini initialization
private get google() {
  if (!this._google) {
    this._google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }
  return this._google;
}
```

### browser-use Integration

**Setup**:
- Python sidecar runs FastAPI server on port 8001
- Node.js communicates via HTTP with retry logic
- Session persistence implemented (Phase 1)

**Browser Actions Available**:
- Navigate to URLs
- Click elements (by selector, text, or AI-prompt)
- Fill forms
- Extract content
- Screenshots
- Multi-tab support (via browser-use library)
- Vision capabilities (if enabled)

**Headless vs Headed**:
- Default: Headless (`headless: true`)
- Can be configured per execution
- Headed mode useful for debugging/teaching

**Session Management** (Phase 1 Implementation):
- Sessions keyed by `guruId:runId`
- Browser instances persist across multiple tool calls
- 30-minute inactivity timeout
- Automatic cleanup

**Code Locations**:
- Python sidecar: `apps/api/src/agents/python/main.py`
- Node.js client: `apps/api/src/lib/ai/sidecarClient.ts`
- Session manager: `apps/api/src/lib/ai/sessionManager.ts`
- Browser tools: `apps/api/src/lib/ai/tools.ts`

### Tools Available to Guru

**Universal Tools** (always available):
- `browse_the_web` - Browser automation
- `systematic-debugging` - Error analysis
- `brainstorming` - Idea generation
- `planning-with-files` - File-based planning

**Domain-Specific Tools** (222+ skills):
- Organized by domain: Productivity, Fitness, Mindfulness, Study, Communication, Research, Creativity, Utility
- Examples:
  - Productivity: `writing-plans`, `file-organizer`, `workflow-automation`
  - Research: `shodan-reconnaissance`, `competitor-alternatives`
  - Communication: `email-sequence`, `slack-bot-builder`
  - Creativity: `ui-ux-pro-max`, `web-artifacts-builder`

**Memory Tools**:
- `save_finding` - Save discoveries to `guru_memory.md`
- `update_task_plan` - Update `task_plan.md` for long-running tasks

**Expert Tools**:
- `lookup_expert_skill` - Get detailed skill instructions
- `execute_skill_script` - Run skill-specific Python scripts

**Code Location**: `apps/api/src/lib/skillMapping.ts`, `apps/api/src/lib/skillRouter.ts`

### Skills System

**Skill Organization**:
- Skills stored in `.agent/skills/` directory
- Each skill has `SKILL.md` file with instructions
- Skills can be mounted dynamically via `SkillMounting` service
- Performance metrics tracked in `skill_performance_metrics` table

**Skill Domains**:
```typescript
enum GuruDomain {
  PRODUCTIVITY = "productivity",
  FITNESS = "fitness",
  MINDFULNESS = "mindfulness",
  STUDY = "study",
  COMMUNICATION = "communication",
  RESEARCH = "research",
  CREATIVITY = "creativity",
  UTILITY = "utility",
}
```

**Skill Selection**:
- `SkillRouter.getToolsForGuru(guruId)` returns domain-specific tools
- Based on guru category and domain profiles
- Universal tools always included

### Memory/Context Management

**Current Implementation**:
- Memory tools save to `memory/guru-{guruId}/` directory
- Files: `findings.md`, `task_plan.md`
- Updated during autonomous runs

**Phase 2 Planned** (Not yet implemented):
- Automatic memory updates during runs
- Long-term memory across sessions
- Context injection for future runs

**Code Location**: `apps/api/src/services/aiService.ts` - `getMemoryTools()`

### Authority Levels

**Not explicitly implemented as GREEN/YELLOW/RED**, but similar concept exists:

**Cognitive Engine Assessment**:
- Pre-execution assessment evaluates:
  - `skill_sufficiency` (1-10)
  - `task_complexity` (1-10)
  - `recent_success_rate` (1-10)
  - `tool_benefit` (1-10)
  - `confidence` (1-10)

**Recommendation Types**:
- `"skills"` - Use expert skills
- `"tools"` - Use browser automation
- `"both"` - Use both
- `"seek_guidance"` - Safety halt (requires human approval)

**Code Location**: `apps/api/src/services/antigravity/cognition.ts`

---

## 4. FILE STRUCTURE

### Complete Directory Tree

```
guru-1/
├── apps/
│   ├── api/                          # Backend API (Node.js + Express)
│   │   ├── src/
│   │   │   ├── index.ts              # Main entry point
│   │   │   ├── routes/               # API route handlers
│   │   │   │   ├── guruRoutes.ts     # Guru CRUD + execution
│   │   │   │   ├── automationRoutes.ts # Automation management
│   │   │   │   ├── guruAutomationRoutes.ts # Guru-specific automations
│   │   │   │   ├── marketplaceRoutes.ts # Template marketplace
│   │   │   │   ├── schedulerRoutes.ts # Scheduled jobs
│   │   │   │   ├── notificationRoutes.ts # Push notifications
│   │   │   │   ├── copilotRoutes.ts  # CopilotKit integration
│   │   │   │   └── chaosRoutes.ts    # Chaos testing endpoints
│   │   │   ├── services/             # Business logic
│   │   │   │   ├── aiService.ts      # LLM integration (DeepSeek, Gemini)
│   │   │   │   ├── guruService.ts    # Guru CRUD operations
│   │   │   │   ├── guruExecutorService.ts # Main execution orchestrator
│   │   │   │   ├── automationService.ts # Browser automation + self-healing
│   │   │   │   ├── GuruGenerator.ts  # AI-powered guru generation
│   │   │   │   ├── metaLearningService.ts # Skill performance tracking
│   │   │   │   ├── missionRunService.ts # Mission run intelligence
│   │   │   │   ├── scheduler.service.ts # Cron job scheduler
│   │   │   │   ├── notificationService.ts # Email/push notifications
│   │   │   │   ├── userProfileService.ts # Browser profile management
│   │   │   │   ├── HyperHealingOrchestrator.ts # Self-healing system
│   │   │   │   └── antigravity/      # Cognitive engine
│   │   │   │       ├── cognition.ts  # Self-assessment + decision-making
│   │   │   │       └── ThresholdOptimizer.ts # Personality-based thresholds
│   │   │   ├── lib/                  # Utilities
│   │   │   │   ├── ai/               # AI-related utilities
│   │   │   │   │   ├── tools.ts      # Browser tool handler
│   │   │   │   │   ├── browserBridge.ts # Legacy Python bridge
│   │   │   │   │   ├── sidecarClient.ts # New HTTP sidecar client (Phase 1)
│   │   │   │   │   └── sessionManager.ts # Session lifecycle management
│   │   │   │   ├── skillRouter.ts    # Domain-specific tool selection
│   │   │   │   ├── skillMapping.ts   # Domain → skills mapping
│   │   │   │   ├── redis.ts          # Redis connection manager
│   │   │   │   └── tracing.ts        # OpenTelemetry tracing
│   │   │   ├── agents/               # Python agents
│   │   │   │   └── python/
│   │   │   │       ├── main.py       # FastAPI sidecar (Phase 1)
│   │   │   │       ├── agent_runner.py # Legacy agent runner
│   │   │   │       ├── capture_dashboard.py # Dashboard capture
│   │   │   │       ├── smoke_test.py # Testing
│   │   │   │       └── requirements.txt # Python dependencies
│   │   │   ├── middleware/           # Express middleware
│   │   │   │   ├── requireAuth.ts    # Supabase auth middleware
│   │   │   │   └── securityHeaders.ts # Security headers
│   │   │   └── managers/             # Service managers
│   │   │       └── AppEnforcer.ts    # App-level enforcement
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                          # Frontend (Next.js)
│       └── src/                      # Frontend source (not detailed here)
├── packages/
│   ├── database/                     # Database schema (Drizzle ORM)
│   │   ├── src/
│   │   │   ├── schema.ts             # Complete database schema (976 lines)
│   │   │   ├── index.ts              # Exports
│   │   │   └── seed.ts               # Seed script
│   │   ├── drizzle/                  # Migration files
│   │   └── drizzle.config.ts         # Drizzle config
│   ├── guru-core/                    # Core guru logic
│   │   └── src/
│   │       ├── gurus.ts              # Guru definitions
│   │       ├── types.ts              # TypeScript types
│   │       ├── engine.ts             # Execution engine
│   │       └── automation-catalog.ts # Automation catalog
│   ├── shared/                        # Shared utilities
│   │   └── src/
│   │       └── index.ts
│   └── antigravity/                  # Antigravity kit components
│       ├── fusion_engine/            # Skill fusion
│       └── skill_primitives/         # Skill primitives
├── guru-gateway/                     # Chat integration gateway
│   └── src/
│       ├── GuruGateway.ts           # Main gateway (WhatsApp, Telegram, Discord)
│       └── index.ts
├── browser-use/                      # browser-use library (submodule/fork)
│   ├── browser_use/                  # Core library
│   │   ├── agent/                    # Agent service
│   │   ├── browser/                  # Browser session management
│   │   ├── tools/                    # Browser tools
│   │   └── skill_cli/                # Skill CLI server
│   ├── browser_use_agent.py         # Standalone agent script
│   └── docs/                         # Documentation
├── .agent/                           # Antigravity agent system
│   ├── agents/                       # 19 specialist agents
│   ├── skills/                       # 222+ skills
│   ├── workflows/                    # Workflow definitions
│   └── plans/                        # Project plans
├── .env.example                      # Environment variables template
├── package.json                      # Root package.json (monorepo)
├── pnpm-workspace.yaml               # PNPM workspace config
├── turbo.json                        # Turborepo config
├── docker-compose.yml                # Docker compose
├── Dockerfile                        # Main Dockerfile
└── README.md                         # Project README
```

### Entry Points

**Backend API**: `apps/api/src/index.ts`
- Express server initialization
- Route registration
- Socket.io setup
- Scheduler service startup

**Python Sidecar**: `apps/api/src/agents/python/main.py`
- FastAPI application
- Session registry
- Browser automation endpoints

**Guru Gateway**: `guru-gateway/src/GuruGateway.ts`
- WebSocket server (port 19789)
- Chat channel adapters
- Browser-use bridge

### Core Business Logic Files

**Execution Flow**:
1. `guruExecutorService.ts` - Main orchestrator
2. `aiService.ts` - LLM reasoning
3. `automationService.ts` - Browser automation + self-healing
4. `tools.ts` - Browser tool handler
5. `sidecarClient.ts` - Python sidecar communication

**Guru Management**:
1. `guruService.ts` - CRUD operations
2. `GuruGenerator.ts` - AI-powered generation
3. `skillRouter.ts` - Tool selection

**Intelligence Systems**:
1. `cognition.ts` - Cognitive engine (assessment + decisions)
2. `metaLearningService.ts` - Skill performance tracking
3. `HyperHealingOrchestrator.ts` - Self-healing system

---

## 5. API ENDPOINTS

### Guru Routes (`/api/gurus`)

**POST `/api/gurus/test/execute`** (No auth required)
- Test endpoint for deployment verification
- Body: `{ task: string, guruId?: string }`
- Returns: Simple success message

**POST `/api/gurus`** (Auth required)
- Create a new Guru
- Body: Guru definition object
- Returns: Created guru

**GET `/api/gurus`** (Auth required)
- List user's Gurus
- Query params: Filtering options
- Returns: Array of gurus

**GET `/api/gurus/:id`** (Auth required)
- Get specific Guru
- Returns: Guru object

**PATCH `/api/gurus/:id`** (Auth required)
- Update Guru
- Body: Partial guru object
- Returns: Updated guru

**DELETE `/api/gurus/:id`** (Auth required)
- Delete Guru
- Returns: 204 No Content

**POST `/api/gurus/:id/execute`** (Auth required)
- Execute Guru automation
- Body: `{ automationId?: string, taskDescription?: string, profileName?: string }`
- Returns: `ExecutionResult`

**POST `/api/gurus/generate`** (Auth required)
- AI-powered Guru generation
- Body: `{ prompt: string }`
- Returns: Generated guru structure

### Automation Routes (`/api/automation`)

**POST `/api/automation/run`** (Auth required)
- Queue an automation task
- Body: `{ automationId?: string, taskDescription: string, config?: object }`
- Returns: `{ message: "Automation queued", jobId: string }`

**GET `/api/automation/status/:jobId`** (Auth required)
- Get automation job status
- Returns: Job status object

**POST `/api/automation/test`** (Auth required)
- Test automation synchronously
- Body: `{ taskDescription: string, config?: object }`
- Returns: `BrowserTaskResult`

### Guru Automation Routes (`/api/guru-automations`)

**POST `/api/guru-automations`** (Auth required)
- Create Guru-specific automation
- Body: `{ name, taskDescription, steps, startingUrl, guruId }`
- Returns: Created automation

### Marketplace Routes (`/api/marketplace`)

**GET `/api/marketplace/templates`** (Public)
- List Guru templates
- Returns: Array of templates

**POST `/api/marketplace/templates/:id/use`** (Auth required)
- Create Guru from template
- Body: Customization options
- Returns: Created guru

**POST `/api/marketplace/templates`** (Auth required)
- Create Guru template
- Body: Template definition
- Returns: Created template

### Scheduler Routes (`/api/scheduler`)

**GET `/api/scheduler/jobs`**
- List all active scheduled jobs
- Returns: `{ success: true, jobs: [] }`

**POST `/api/scheduler/reschedule/:guruId`**
- Reschedule Guru automation
- Body: `{ trigger: object }`
- Returns: `{ success: true, message: string }`

**POST `/api/scheduler/pause/:guruId`**
- Pause scheduled automation
- Returns: `{ success: true, message: string }`

### Notification Routes (`/api/notifications`)

**GET `/api/notifications/vapid-key`** (Public)
- Get VAPID public key for push notifications
- Returns: `{ publicKey: string }`

**POST `/api/notifications/subscribe`** (Auth required)
- Subscribe to push notifications
- Body: `{ endpoint: string, keys: object }`
- Returns: `{ success: true }`

**POST `/api/notifications/unsubscribe`** (Auth required)
- Unsubscribe from push notifications
- Body: `{ endpoint: string }`
- Returns: `{ success: true }`

### Copilot Routes (`/api/copilot`)

**POST `/api/copilot`**
- CopilotKit runtime endpoint
- Uses `@copilotkit/runtime`
- Handles CopilotKit requests

### Chaos Routes (`/api/test/chaos`)

**POST `/api/test/chaos/missing-dep`**
- Chaos test: Missing dependency trap
- Body: `{ runId?: string }`
- Tests self-healing for missing dependencies

**POST `/api/test/chaos/logic-error`**
- Chaos test: Logic error
- Body: `{ runId?: string }`
- Tests self-healing for logic errors

### Health Endpoint

**GET `/api/health`**
- Health check
- Returns: `{ status: "ok", timestamp: string, service: "floguru-api" }`

### Python Sidecar Endpoints (`http://localhost:8001`)

**GET `/health`**
- Health check
- Returns: `{ status: "healthy", timestamp: string }`

**POST `/execute`** (Legacy)
- Execute task (creates new browser)
- Body: `ExecuteRequest`
- Returns: `ExecuteResponse`

**POST `/sessions/create`**
- Create persistent browser session
- Query params: `headless`, `llm_provider`, `llm_model`
- Returns: `{ success: true, session_id: string, created_at: string }`

**POST `/sessions/{session_id}/execute`**
- Execute task with session
- Body: `SessionExecuteRequest`
- Returns: `ExecuteResponse`

**GET `/sessions`**
- List all active sessions
- Returns: `{ success: true, sessions: [], count: number }`

**DELETE `/sessions/{session_id}`**
- Close specific session
- Returns: `{ success: true, message: string }`

**DELETE `/sessions`**
- Close all sessions
- Returns: `{ success: true, message: string }`

---

## 6. DATABASE

### Full Schema

**Database**: PostgreSQL (Supabase)  
**ORM**: Drizzle ORM v0.30.0  
**Schema File**: `packages/database/src/schema.ts` (976 lines)

### Key Tables

#### Users & Authentication

**`users`**
- `id` (uuid, PK)
- `email` (text, unique)
- `name` (text)
- `avatar_url` (text)
- `subscription_tier` (enum: free, pro, unlimited, lifetime)
- `subscription_expires_at` (timestamp)
- `stripe_customer_id` (text)
- `onboarding_completed` (boolean)
- `quiz_answers` (jsonb)
- `total_streak_days`, `longest_streak`, `total_habits_completed` (integers)
- `coins` (integer, default 100)
- `created_at`, `updated_at`, `last_active_at` (timestamps)

**`user_gurus`** (Many-to-Many)
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `guru_id` (text)
- `is_primary` (boolean)
- `settings` (jsonb)
- `habits_completed`, `current_streak` (integers)
- `assigned_at`, `last_interaction_at` (timestamps)

#### Gurus

**`gurus`**
- `id` (uuid, PK)
- `name`, `description`, `category`, `personality` (text)
- `personality_bias` (jsonb: riskTolerance, cautiousness, experimentalism)
- `avatar_url`, `accent_color` (text)
- `system_prompt` (text)
- `sample_messages` (jsonb array)
- `automation_ids` (jsonb array)
- `enabled` (boolean)
- `total_runs`, `successful_runs`, `current_streak`, `longest_streak` (integers)
- `is_template`, `is_public` (boolean)
- `price` (decimal)
- `downloads` (integer)
- `rating` (decimal)
- `created_by` (uuid, FK → users)
- `created_at`, `updated_at` (timestamps)

**`guru_templates`**
- `id` (uuid, PK)
- `name`, `description`, `category` (text)
- `preview_image`, `demo_video` (text)
- `automation_template` (jsonb)
- `downloads`, `review_count` (integers)
- `rating` (decimal)
- `is_premium` (boolean)
- `price` (decimal)
- `creator_id` (uuid, FK → users)
- `creator_name` (text)
- `tags` (jsonb array)
- `published`, `featured` (boolean)
- `created_at`, `updated_at` (timestamps)

**`guru_automations`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `guru_id` (uuid, FK → gurus)
- `name`, `description`, `task_description` (text)
- `steps` (jsonb array)
- `trigger` (jsonb: type, time, days, timezone, etc.)
- `notifications` (jsonb: sendStart, sendComplete, channels, etc.)
- `execution_settings` (jsonb: maxRetries, timeout, enableSelfHealing, etc.)
- `last_run`, `next_run` (timestamps)
- `run_count`, `success_count`, `failure_count` (integers)
- `current_streak`, `longest_streak` (integers)
- `created_at`, `updated_at` (timestamps)

**`guru_executions`**
- `id` (uuid, PK)
- `guru_id` (uuid, FK → gurus)
- `automation_id` (uuid)
- `triggered_by` (text)
- `status` (text: running, success, failed, healed)
- `error_message` (text)
- `execution_time_ms` (integer)
- `started_at`, `completed_at`, `created_at` (timestamps)

**`mission_runs`**
- `id` (uuid, PK)
- `guru_id` (uuid, FK → gurus)
- `user_id` (uuid, FK → users)
- `status` (enum: queued, running, success, failed, etc.)
- `started_at`, `completed_at` (timestamps)
- `duration_ms` (integer)
- `summary` (text)
- `screenshot_urls` (jsonb array)
- `log_entries` (jsonb array)
- `findings_md`, `task_plan_md` (text)
- `error_trace` (text)
- `created_at`, `updated_at` (timestamps)

#### Automations

**`automations`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `name`, `description`, `task_description` (text)
- `requires_confirmation` (boolean)
- `is_active`, `is_favorite` (boolean)
- `run_count`, `success_count` (integers)
- `avg_duration_ms` (integer)
- `last_run_at` (timestamp)
- `last_run_status` (text)
- `created_at`, `updated_at` (timestamps)

**`automation_runs`**
- `id` (uuid, PK)
- `automation_id` (uuid, FK → automations)
- `user_id` (uuid, FK → users)
- `job_id` (text, unique)
- `status` (enum: queued, running, success, failed, etc.)
- `triggered_by`, `triggered_at` (text, timestamp)
- `context` (jsonb)
- `history`, `screenshots` (jsonb arrays)
- `video_url` (text)
- `error_message`, `error_code` (text)
- `retry_count`, `max_retries` (integers)
- `completed_at` (timestamp)
- `duration_ms` (integer)
- `agent_actions` (jsonb array)
- `healing_cost` (real)
- `confirmation_requested_at`, `confirmation_prompt` (timestamp, text)
- `confirmed_at` (timestamp)
- `confirmed_by` (uuid, FK → users)
- `created_at`, `updated_at` (timestamps)

#### Habits

**`habits`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `guru_id` (text)
- `name`, `emoji`, `description` (text)
- `frequency` (enum: daily, weekly, monthly)
- `scheduled_time` (text, HH:MM)
- `duration_minutes` (integer)
- `automatable`, `automation_enabled` (boolean)
- `automation_id` (text)
- `is_active`, `is_premium` (boolean)
- `current_streak`, `longest_streak`, `total_completions` (integers)
- `sort_order` (integer)
- `created_at`, `updated_at` (timestamps)

**`habit_completions`**
- `id` (uuid, PK)
- `habit_id` (uuid, FK → habits)
- `user_id` (uuid, FK → users)
- `completed_at`, `scheduled_for` (timestamps)
- `status` (enum: pending, completed, skipped, failed)
- `notes` (text)
- `mood` (integer, 1-5)
- `was_automated` (boolean)
- `automation_log` (jsonb)
- `coins_earned` (integer)

#### Self-Healing System

**`automation_solutions`**
- `id` (uuid, PK)
- `error_signature` (text, indexed)
- `solution_type` (text, default "AI_FIX")
- `solution` (jsonb)
- `context_tags` (jsonb)
- `confidence_score` (integer)
- `success_count`, `total_count` (integers)
- `first_used_at`, `last_used_at` (timestamps)
- `created_by_guru_id` (uuid, FK → gurus)
- `created_at` (timestamp)

**`healing_events`**
- `id` (uuid, PK)
- `mission_run_id` (uuid, FK → mission_runs)
- `error_signature` (text)
- `attempted_fix` (jsonb)
- `fix_type` (text)
- `outcome` (text: SUCCESS, FAILED, PARTIAL)
- `confidence_used` (integer)
- `processing_time` (integer)
- `timestamp` (timestamp)

#### Skill Performance

**`skill_performance_metrics`**
- `id` (uuid, PK)
- `skill_name` (text, indexed)
- `domain` (text, indexed)
- `success_count`, `total_count` (integers)
- `avg_duration_ms` (integer)
- `confidence_score` (integer)
- `is_quarantined` (boolean)
- `quarantine_since` (timestamp)
- `last_global_success_rate` (decimal)
- `last_used_at`, `created_at`, `updated_at` (timestamps)

**`global_confidence_matrix`**
- `id` (uuid, PK)
- `skill_id` (text, unique)
- `confidence` (decimal)
- `success_rate` (decimal)
- `total_uses` (integer)
- `avg_latency_ms` (integer)
- `matrix_version` (integer)
- `updated_at` (timestamp)

#### User Profiles (Session Persistence)

**`user_profiles`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `guru_id` (uuid, FK → gurus)
- `name` (text, e.g., "gmail-work")
- `browser_type` (text, default "chromium")
- `profile_path` (text, absolute path)
- `is_active` (boolean)
- `credentials` (jsonb, metadata only, never passwords)
- `last_used_at`, `created_at`, `updated_at` (timestamps)
- Index: `(guru_id, name)`

#### Credentials

**`user_credentials`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `service_name` (text)
- `service_type` (text: oauth, password, api_key)
- `encrypted_credentials` (text, encrypted)
- `access_token_expires_at` (timestamp)
- `refresh_token` (text)
- `is_active` (boolean)
- `last_verified_at` (timestamp)
- `created_at`, `updated_at` (timestamps)

#### Community

**`community_automations`**
- `id` (uuid, PK)
- `automation_id` (uuid, FK → automations)
- `creator_id` (uuid, FK → users)
- `title`, `description`, `long_description` (text)
- `category` (text)
- `tags` (jsonb array)
- `cover_image_url`, `demo_video_url` (text)
- `screenshots` (jsonb array)
- `required_services`, `required_permissions` (jsonb arrays)
- `install_count`, `run_count`, `review_count` (integers)
- `success_rate`, `avg_rating` (integers)
- `status` (text: draft, published, featured, archived)
- `is_verified`, `featured` (boolean)
- `featured_at` (timestamp)
- `version`, `changelog` (text)
- `created_at`, `updated_at`, `published_at` (timestamps)

**`guru_template_reviews`**
- `id` (uuid, PK)
- `template_id` (uuid, FK → guru_templates)
- `user_id` (uuid, FK → users)
- `rating` (integer)
- `review` (text)
- `created_at` (timestamp)

#### Other Tables

**`push_subscriptions`** - Web push notification subscriptions
**`streak_freezes`** - Purchased streak freezes
**`coin_transactions`** - Coin transaction history

### Supabase Setup

**Connection**:
- URL: `DATABASE_URL` environment variable
- Format: `postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- Service Role Key: `SUPABASE_SERVICE_ROLE_KEY` for admin operations

**Migrations**:
- Managed via Drizzle Kit
- Migration files in `packages/database/drizzle/`
- Run: `pnpm --filter @guru/database run db:push`

---

## 7. ENVIRONMENT & CONFIG

### Environment Variables

**From `.env.example`**:

```bash
# Supabase / PostgreSQL
DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# AI Provider Keys
GOOGLE_AI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Automation
BROWSER_USE_API_KEY=your_browser_use_api_key

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis (Optional)
ENABLE_REDIS=false
REDIS_URL=redis://localhost:6379

# Python Sidecar
PYTHON_SIDECAR_URL=http://localhost:8001
PYTHON_PATH=python
BRIDGE_TIMEOUT_MS=120000

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Chat Integrations (Guru Gateway)
TELEGRAM_BOT_TOKEN=your_telegram_token
DISCORD_BOT_TOKEN=your_discord_token
```

### External Services

**Supabase**:
- PostgreSQL database
- Authentication (Supabase Auth)
- Storage (if used)

**Redis** (Optional):
- BullMQ job queues
- Only if `ENABLE_REDIS=true`

**Stripe**:
- Payment processing
- Subscription management

**AI Providers**:
- DeepSeek API (primary)
- Google AI Studio (Gemini)
- Anthropic Claude (optional)
- OpenAI (optional)

**Browser-Use Cloud** (Optional):
- Cloud browser service
- Requires `BROWSER_USE_API_KEY`

### browser-use Config

**Version**: 0.11.4 (from pip list)

**Configuration**:
- Default mode: Headless Chromium
- Can use real Chrome with profile
- Cloud browser option available
- Multi-tab support
- Vision capabilities (if enabled)

**Python Requirements**:
```
browser-use
langchain-google-genai
langchain-anthropic
python-dotenv
pydantic>=2.0.0
fastapi==0.115.0
uvicorn[standard]==0.32.0
langchain-openai==0.2.0
httpx==0.27.2
```

### Deployment Config

**Railway**:
- `railway.toml` present
- Environment variables via Railway dashboard

**Docker**:
- `Dockerfile` for API
- `browser-use.Dockerfile` for browser automation
- `docker-compose.yml` for local development

**GitHub Actions**:
- `.github/workflows/deploy.yml`
- CI/CD pipeline

---

## 8. browser-use SPECIFICS

### Version

**browser-use**: 0.11.4 (installed via pip)

### Configuration

**Browser Modes**:
- `chromium` - Playwright-managed Chromium (default)
- `real` - User's Chrome with profile
- `remote` - Browser-Use Cloud (requires API key)

**Session Management** (Phase 1 Implementation):
- Sessions stored in `SessionRegistry` (Python sidecar)
- Key format: `guruId:runId` → `sessionId`
- 30-minute inactivity timeout
- Automatic cleanup

**Code Location**: `apps/api/src/agents/python/main.py`

### How Guru Invokes Browser Actions

**Flow**:
1. Guru calls `browse_the_web` tool via `aiService.executeReasoning()`
2. `handleBrowseTheWeb()` in `tools.ts` receives request
3. Checks for `guruId` and `runId` in context
4. If present: Uses `sidecarClient.executeWithSession()`
5. If absent: Falls back to `browserBridge.executeTask()` (spawns new process)
6. Python sidecar executes via browser-use `Agent.run()`
7. Results returned through chain

**Code Flow**:
```
aiService.executeReasoning()
  → getBrowserTools(guruId, runId)
    → browse_the_web tool
      → handleBrowseTheWeb(args, {guruId, runId})
        → sessionManager.getOrCreateSession(guruId, runId)
        → sidecarClient.executeWithSession({session_id, task_description})
          → HTTP POST /sessions/{id}/execute
            → Python sidecar: session.agent.run()
              → browser-use Agent executes task
```

**Code Locations**:
- Tool definition: `apps/api/src/lib/ai/tools.ts`
- Session manager: `apps/api/src/lib/ai/sessionManager.ts`
- Sidecar client: `apps/api/src/lib/ai/sidecarClient.ts`
- Python sidecar: `apps/api/src/agents/python/main.py`

### Error Handling

**Retry Logic** (Node.js side):
- Exponential backoff (3 attempts)
- Retries on network errors and 5xx errors
- Health check monitoring (every 30 seconds)

**Self-Healing** (Python side):
- HyperHealingOrchestrator analyzes errors
- Looks up solutions in `automation_solutions` table
- Attempts fixes based on error signatures
- Records outcomes in `healing_events` table

**Fallback Chain**:
1. Session-based execution (if guruId/runId provided)
2. BrowserBridge execution (spawns new process)
3. Alternative providers (deepseek, google)

### Screenshots/Recording

**Screenshots**:
- Can be enabled via `saveScreenshots: true`
- Saved to `screenshots/` directory
- Interval: `final` or `step`

**Video Recording**:
- Not currently implemented
- Can be added via browser-use capabilities

### Proxy Setup

**Not currently configured**:
- Can be added via browser-use Cloud browser
- Or via Playwright proxy configuration

---

## 9. INTEGRATION POINTS

### WhatsApp Integration

**Via Guru Gateway** (`guru-gateway/src/GuruGateway.ts`):
- Uses `@whiskeysockets/baileys` for WhatsApp
- WebSocket server on port 19789
- Receives messages, routes to Guru, executes, responds

**Message Flow**:
```
WhatsApp Message
  → Guru Gateway WebSocket
    → pickGuru(text) - routes to appropriate Guru
    → BrowserUseBridge.exec(payload)
      → Python browser_use_agent.py
        → Browser automation
          → Result returned
            → ChannelAdapter.send("whatsapp", from, reply)
```

**Note**: WhatsApp handling may be delegated to external service (Moltbot mentioned but not found in codebase)

### Telegram Integration

**Via Guru Gateway**:
- Uses `grammy` library
- Bot token: `TELEGRAM_BOT_TOKEN`
- Listens for messages, routes to Guru, responds

### Discord Integration

**Via Guru Gateway**:
- Uses `discord.js`
- Bot token: `DISCORD_BOT_TOKEN`
- Listens for messages in channels, routes to Guru, responds

### Message Flow (All Channels)

```mermaid
sequenceDiagram
    participant User
    participant Channel as WhatsApp/Telegram/Discord
    participant Gateway as Guru Gateway<br/>WebSocket :19789
    participant Bridge as BrowserUseBridge
    participant Python as browser_use_agent.py
    participant Browser as browser-use
    
    User->>Channel: Send message
    Channel->>Gateway: WebSocket message<br/>{channel, from, text}
    Gateway->>Gateway: pickGuru(text)
    Gateway->>Bridge: exec({guru, task, llm})
    Bridge->>Python: JSON payload via stdin
    Python->>Browser: Agent.run(task)
    Browser-->>Python: History + results
    Python-->>Bridge: JSON result via stdout
    Bridge-->>Gateway: Result object
    Gateway->>Gateway: Format reply
    Gateway->>Channel: ChannelAdapter.send()
    Channel->>User: Reply message
```

---

## 10. KEY FEATURES STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| **WhatsApp chat** | ✅ Implemented | Via guru-gateway, WebSocket + Baileys |
| **Telegram chat** | ✅ Implemented | Via guru-gateway, Grammy bot |
| **Discord chat** | ✅ Implemented | Via guru-gateway, Discord.js |
| **Web browsing** | ✅ Working | browser-use integration, Phase 1 session persistence |
| **Form filling** | ✅ Working | Via browser-use Agent capabilities |
| **Research tasks** | ✅ Working | Guru can browse, extract, summarize |
| **Scheduling** | ✅ Implemented | Cron-based scheduler, scheduled automations |
| **Workflows** | ✅ Working | Guru automations with triggers |
| **Session persistence** | ✅ Implemented | Phase 1 complete, browser stays open across calls |
| **Self-healing** | ✅ Implemented | HyperHealingOrchestrator, solution database |
| **Skill system** | ✅ Working | 222+ skills, domain-based routing |
| **Memory system** | ⚠️ Partial | Memory tools exist, Phase 2 planned for auto-updates |
| **Marketplace** | ⚠️ Partial | Templates exist, detail views pending |
| **Push notifications** | ✅ Implemented | Web push via service workers |
| **Email notifications** | ✅ Implemented | Via Resend service |
| **User profiles** | ✅ Implemented | Browser profile persistence |
| **Guru generation** | ✅ Working | AI-powered Guru creation |
| **CopilotKit** | ✅ Integrated | CopilotKit runtime endpoint |

---

## 11. KNOWN ISSUES & TECH DEBT

### Current Bugs

1. **Python Sidecar Environment**:
   - FastAPI not installed in current workspace Python environment
   - Requires: `pip install -r apps/api/src/agents/python/requirements.txt`
   - Workspace path change may require environment reconfiguration

2. **Peer Dependency Warnings**:
   - `@copilotkit/runtime` expects older OpenAI versions (have v6.16.0)
   - `next-intl` expects Next.js 10-15 (have v16.1.4)
   - Non-critical but should be addressed

### browser-use Issues

- None currently identified
- Session persistence working as designed
- Multi-tab and vision capabilities not yet fully integrated

### Performance Concerns

1. **Session Timeout**: Fixed at 30 minutes (configurable but not exposed)
2. **Memory Usage**: Sessions stored in memory (not persisted across sidecar restarts)
3. **Context Window**: Large skill sets may bloat LLM context (intent-based filtering planned)

### Blockers

1. **Python Environment Setup**: Sidecar requires proper Python environment
2. **Testing**: End-to-end browser automation testing blocked by sidecar issue
3. **Phase 2 Memory System**: Not yet implemented (planned)

---

## 12. CRITICAL CODE SNIPPETS

### Guru Agent Initialization

**File**: `apps/api/src/services/guruExecutorService.ts`

```typescript
async executeGuruAutomation(
  guruId: string,
  automationId: string,
  triggeredBy: string = "manual",
  options: {
    taskDescription?: string;
    profileName?: string;
    userId?: string;
  } = {},
): Promise<ExecutionResult> {
  // 1. Fetch Guru
  const [guru] = await db.select().from(gurus).where(eq(gurus.id, guruId));
  
  // 2. Build personality prompt
  const personalityPrompt = await this.buildPersonalityPrompt(guru);
  
  // 3. Get self-assessment
  const assessment = await aiService.getSelfAssessment({
    taskDescription: taskToRun,
    guru,
  });
  
  // 4. Cognitive decision
  const cogDecision = await cognitiveEngine.decideForTask(
    { id: missionRun.id, description: taskToRun, availableSkills: tools, personality },
    assessment,
  );
  
  // 5. Execute with self-healing
  const executionResult = await automationService.executeWithSelfHealing(
    `${guru.name}: ${automationName}`,
    executionIdForSocket,
    async () => {
      return aiService.executeReasoning({
        systemPrompt: personalityPrompt,
        userPrompt: `STARTING TASK: ${taskToRun}`,
        guruId: guru.id,
        maxSteps: 30,
        tools: tools,
        meta: {
          personality: guru.personalityBias,
          globalConfidence: cogDecision.assessment.skill_sufficiency,
          runId: executionIdForSocket, // For session persistence
        },
      });
    },
    { profileName: activeProfileName },
  );
  
  return executionResult;
}
```

### LLM Prompt/System Message

**File**: `apps/api/src/services/guruExecutorService.ts`

```typescript
private async buildPersonalityPrompt(guru: any): Promise<string> {
  // Builds custom system prompt based on guru personality
  // Includes personality traits, mission, sample messages
  // Returns formatted prompt string
}
```

**File**: `apps/api/src/services/aiService.ts`

```typescript
async executeReasoning(params: {
  systemPrompt: string;
  userPrompt: string;
  guruId?: string;
  maxSteps?: number;
  tools?: string[];
  meta?: {
    globalConfidence?: number;
    personality?: any;
    runId?: string;
  };
}) {
  const result = await generateText({
    model: this.deepseek.chat("deepseek-chat"),
    system: params.systemPrompt,
    prompt: params.userPrompt,
    tools: {
      ...this.getBrowserTools(params.guruId, params.meta?.runId),
      ...this.getMemoryTools(params.guruId),
      ...this.getExpertTools(params.tools || []),
    } as any,
  });
  
  return {
    success: true,
    text: result.text,
    toolCalls: result.toolCalls,
    usage: result.usage,
    provider: "deepseek",
  };
}
```

### browser-use Setup

**File**: `apps/api/src/agents/python/main.py`

```python
from browser_use import Agent, Browser, ChatGoogleGenerativeAI, ChatOpenAI

# Session Registry
class SessionRegistry:
    def __init__(self):
        self._sessions: Dict[str, SessionInfo] = {}
        self._lock = asyncio.Lock()
        self.session_timeout_seconds = 30 * 60
    
    async def get_or_create(self, session_id, headless, llm_provider, llm_model):
        # Get existing or create new browser session
        if session_id in self._sessions:
            return self._sessions[session_id]
        
        llm = get_llm(llm_provider, llm_model)
        browser = Browser(headless=headless)
        agent = Agent(task="", llm=llm, browser=browser)
        
        session_info = SessionInfo(
            session_id=session_id,
            browser=browser,
            agent=agent,
            headless=headless,
            created_at=datetime.utcnow()
        )
        
        self._sessions[session_id] = session_info
        return session_info

# Execute with session
@app.post("/sessions/{session_id}/execute")
async def execute_with_session(session_id: str, request: SessionExecuteRequest):
    session = await session_registry.get_or_create(
        session_id=session_id,
        headless=request.headless,
        llm_provider=request.llm_provider,
        llm_model=request.llm_model,
    )
    
    session.agent.task = request.task_description
    history = await session.agent.run()
    
    return ExecuteResponse(
        success=True,
        run_id=request.run_id or session_id,
        history=process_history(history),
        ...
    )
```

### Task Execution Loop

**File**: `apps/api/src/services/automationService.ts`

```typescript
async executeWithSelfHealing<T>(
  taskName: string,
  runId: string,
  operation: () => Promise<T>,
  options?: { profileName?: string },
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  // Broadcast START to Swarm
  // Create run record in Supabase
  // Emit Socket.io status
  
  try {
    const result = await operation();
    
    // Update run record: SUCCESS
    // Broadcast SUCCESS to Swarm
    return { success: true, data: result };
    
  } catch (error: any) {
    // Broadcast HEALING to Swarm
    // Mark run as "healing"
    
    try {
      // TRIGGER HYPER-HEALING ORCHESTRATOR
      const healingContext = {
        error,
        step: { task: taskName },
        browserContext: { browserType: "chromium" },
        domain: "unknown",
        missionRunId: runId,
        guruId: options?.profileName?.split("/")[1] || "unknown",
      };
      
      const decision = await hyperHealingOrchestrator.orchestrateHealing(healingContext);
      
      if (decision.solution) {
        // Apply solution
        const result = await decision.solution.apply();
        return { success: true, data: result, fixedByAgent: true };
      }
      
      throw error;
    } catch (agentError: any) {
      // Self-healing failed
      // Update run record: FAILED
      return { success: false, error: error.message };
    }
  }
}
```

### Tool Definitions

**File**: `apps/api/src/lib/ai/tools.ts`

```typescript
export const BrowseTheWebSchema = z.object({
  task: z.string().describe("Natural language description of what you want the browser to do"),
  max_steps: z.number().optional().default(10),
  headless: z.boolean().optional().default(true),
});

export async function handleBrowseTheWeb(
  args: unknown,
  context?: { guruId?: string; runId?: string }
) {
  const { task, max_steps, headless } = BrowseTheWebSchema.parse(args);
  
  // 1. Try session-based execution (if context provided)
  if (context?.guruId && context?.runId) {
    const sessionId = await sessionManager.getOrCreateSession(
      context.guruId,
      context.runId,
      { headless, llm_provider: "google" }
    );
    
    const sessionResult = await sidecarClient.executeWithSession({
      task_description: task,
      session_id: sessionId,
      headless,
      llm_provider: "google",
      run_id: context.runId,
    });
    
    if (sessionResult.success) {
      return {
        success: true,
        summary: `Completed in ${sessionResult.history.length} steps`,
        content: sessionResult.history.map((h) => `${h.step}. ${h.action}`).join("\n"),
        meta: {
          provider: "sidecar-session",
          steps: sessionResult.history.length,
          session_id: sessionId,
        },
      };
    }
  }
  
  // 2. Fallback to browserBridge
  // 3. Fallback to alternative providers
  // ...
}
```

**File**: `apps/api/src/services/aiService.ts`

```typescript
private getBrowserTools(guruId?: string, runId?: string): any {
  return {
    browse_the_web: tool({
      description: browseTheWebTool.function.description,
      parameters: BrowseTheWebSchema,
      execute: async (args: any) => 
        handleBrowseTheWeb(args, { guruId, runId }),
    } as any),
  };
}
```

---

## 13. DEPENDENCIES

### Node.js Dependencies (apps/api/package.json)

**Core**:
- `express`: ^4.18.0
- `typescript`: ^5.0.0
- `drizzle-orm`: ^0.30.0
- `zod`: ^3.22.0

**AI/LLM**:
- `ai`: ^6.0.48 (Vercel AI SDK)
- `@ai-sdk/openai`: ^3.0.18
- `@ai-sdk/google`: ^3.0.13
- `openai`: ^6.16.0
- `@google/generative-ai`: ^0.24.1

**Database**:
- `@supabase/supabase-js`: ^2.39.0
- `postgres`: ^3.4.0

**Browser Automation**:
- `axios`: ^1.13.2
- `axios-retry`: ^4.5.0 (Phase 1)

**Queue/Redis**:
- `bullmq`: ^5.66.5
- `ioredis`: ^5.9.2

**Real-time**:
- `socket.io`: ^4.8.3

**Other**:
- `@copilotkit/runtime`: ^1.51.2
- `cron`: ^4.4.0
- `dotenv`: ^16.6.1
- `helmet`: ^7.0.0
- `express-rate-limit`: ^7.1.5
- `resend`: 6.8.0 (email)
- `web-push`: ^3.6.7 (push notifications)

### Python Dependencies (apps/api/src/agents/python/requirements.txt)

```
browser-use
langchain-google-genai
langchain-anthropic
python-dotenv
pydantic>=2.0.0
fastapi==0.115.0
uvicorn[standard]==0.32.0
langchain-openai==0.2.0
httpx==0.27.2
```

### browser-use Version

**Version**: 0.11.4 (from pip list output)

### Python vs Node Components

**Node.js**:
- API server (Express)
- Guru execution orchestration
- LLM reasoning (DeepSeek, Gemini)
- Tool calling and coordination
- Database operations
- Real-time updates (Socket.io)

**Python**:
- Browser automation sidecar (FastAPI)
- browser-use library execution
- Session management
- Browser control (Playwright/CDP)

**Communication**:
- HTTP REST API (Node → Python)
- Retry logic with exponential backoff
- Health checks
- Session-based execution

---

## 14. DEPLOYMENT

### Current Setup

**Development**:
- Local: `pnpm dev` (runs API + frontend)
- Python sidecar: `python apps/api/src/agents/python/main.py`
- Guru gateway: `node guru-gateway/src/index.ts`

**Production**:
- Railway: Configured via `railway.toml`
- Docker: `Dockerfile` for API, `browser-use.Dockerfile` for browser automation
- GitHub Actions: `.github/workflows/deploy.yml`

### Production Considerations

**Browser Automation in Production**:
- **Headless mode**: Default, works in containers
- **Headed mode**: Requires display server (Xvfb) in Docker
- **Session persistence**: In-memory (lost on restart), consider Redis for persistence
- **Resource limits**: Browser instances consume memory, monitor closely

**Environment Differences**:
- Development: Local Python environment
- Production: Docker container with Python + dependencies
- Sidecar URL: `PYTHON_SIDECAR_URL` environment variable

**Scaling**:
- API: Stateless, can scale horizontally
- Python sidecar: Stateful (sessions), consider session store (Redis)
- Database: Supabase handles scaling

---

## 15. QUICK START

### Steps to Run Locally

**1. Install Dependencies**:
```bash
# Root
pnpm install

# Python (for sidecar)
cd apps/api/src/agents/python
pip install -r requirements.txt
```

**2. Set Up Environment**:
```bash
# Copy .env.example to .env
cp .env.example .env

# Fill in required values:
# - DATABASE_URL (Supabase)
# - GOOGLE_AI_API_KEY
# - DEEPSEEK_API_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

**3. Set Up Database**:
```bash
# Run migrations
pnpm --filter @guru/database run db:push

# Seed initial data (optional)
pnpm --filter @guru/database run db:seed
```

**4. Start Python Sidecar**:
```bash
cd apps/api/src/agents/python
python main.py
# Should start on http://localhost:8001
```

**5. Start API Server**:
```bash
cd apps/api
pnpm dev
# Should start on http://localhost:4000
```

**6. Start Frontend** (optional):
```bash
cd apps/web
pnpm dev
# Should start on http://localhost:3000
```

### browser-use Requirements

**System Requirements**:
- Python 3.11+
- Chrome/Chromium installed
- Playwright browsers installed: `playwright install chromium`

**Python Environment**:
```bash
pip install browser-use fastapi uvicorn
```

### How to Test a Simple Task

**Via API** (requires auth):
```bash
curl -X POST http://localhost:4000/api/automations/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"taskDescription": "Navigate to example.com and extract the title"}'
```

**Via Python Sidecar** (no auth):
```bash
# Create session
curl -X POST http://localhost:8001/sessions/create?headless=true

# Execute task (use session_id from above)
curl -X POST http://localhost:8001/sessions/{session_id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Navigate to example.com and extract the title",
    "headless": true,
    "llm_provider": "google"
  }'
```

**Via Guru Execution** (requires Guru in database):
```bash
curl -X POST http://localhost:4000/api/gurus/{guru_id}/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "taskDescription": "Search Google for weather in Montreal"
  }'
```

---

## APPENDIX: Additional Notes

### Clawdbot/Claude Integration

**Note**: The user mentioned "Clawdbot (Claude)" but in the codebase:
- **Claude** is available via LangChain (`langchain-anthropic`)
- **Clawdbot** is not found as a separate component
- The system primarily uses **DeepSeek** and **Gemini**
- Claude can be used but is not the primary brain

**Claude Usage**:
- Available via `ChatAnthropic` from LangChain
- Can be configured in `get_llm()` function in Python sidecar
- Not currently the default LLM

### Moltbot Integration

**Note**: User mentioned Moltbot for WhatsApp, but:
- **Guru Gateway** handles WhatsApp via `@whiskeysockets/baileys`
- No Moltbot integration found in codebase
- WhatsApp flow: Message → Guru Gateway → BrowserUseBridge → Python → Response

### Architecture Clarifications

**Guru vs MaX**:
- **Guru** = The FloGuru AI agent (the main concept)
- **MaX** = Not found in codebase (may be outdated reference)

**Guru vs Clawdbot**:
- **Guru** = The FloGuru AI agent system
- **Clawdbot** = Not a separate component (Claude is available via LangChain)

**The Core Magic**:
Guru + DeepSeek/Gemini + browser-use work together:
1. User gives task to Guru
2. Guru reasons with DeepSeek (or Gemini fallback)
3. Guru calls `browse_the_web` tool
4. Tool routes to Python sidecar with session persistence
5. browser-use Agent executes browser automation
6. Results flow back through the chain
7. Guru responds to user

---

**End of Snapshot**

This document captures the complete FloGuru architecture, implementation, and current state as of 2026-01-29. Use this to rebuild, continue development, or onboard new team members.
