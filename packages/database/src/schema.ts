// ============================================
// FLOGURU DATABASE SCHEMA
// ============================================
// Using Drizzle ORM with Supabase PostgreSQL

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  uuid,
  index,
  pgEnum,
  real,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "unlimited",
  "lifetime",
]);
export const habitFrequencyEnum = pgEnum("habit_frequency", [
  "daily",
  "weekly",
  "monthly",
]);
export const completionStatusEnum = pgEnum("completion_status", [
  "pending",
  "completed",
  "skipped",
  "failed",
]);
export const automationTypeEnum = pgEnum("automation_type", [
  "template",
  "recorded",
  "custom",
  "community",
]);
export const triggerTypeEnum = pgEnum("trigger_type", [
  "manual",
  "schedule",
  "habit_event",
  "condition",
]);
export const runStatusEnum = pgEnum("run_status", [
  "queued",
  "running",
  "awaiting_confirmation",
  "success",
  "failed",
  "cancelled",
  "timeout",
]);

// ============================================
// USERS
// ============================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),

  // Subscription
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  stripeCustomerId: text("stripe_customer_id"),

  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  quizAnswers: jsonb("quiz_answers"),

  // Stats
  totalStreakDays: integer("total_streak_days").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalHabitsCompleted: integer("total_habits_completed").default(0).notNull(),

  // Coins/Gamification
  coins: integer("coins").default(100).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

// ============================================
// USER GURUS (Many-to-Many)
// ============================================

export const userGurus = pgTable("user_gurus", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  guruId: text("guru_id").notNull(), // References guru-core GURUS

  // Is this the user's primary guru?
  isPrimary: boolean("is_primary").default(false).notNull(),

  // Guru-specific settings
  settings: jsonb("settings").default({}).notNull(),

  // Stats with this guru
  habitsCompleted: integer("habits_completed").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),

  // Timestamps
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  lastInteractionAt: timestamp("last_interaction_at"),
});

// ============================================
// HABITS
// ============================================

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  guruId: text("guru_id").notNull(),

  // Habit details
  name: text("name").notNull(),
  emoji: text("emoji").default("✅").notNull(),
  description: text("description"),

  // Schedule
  frequency: habitFrequencyEnum("frequency").default("daily").notNull(),
  scheduledTime: text("scheduled_time"), // HH:MM format
  durationMinutes: integer("duration_minutes"),

  // Automation
  automatable: boolean("automatable").default(false).notNull(),
  automationId: text("automation_id"),
  automationEnabled: boolean("automation_enabled").default(false).notNull(),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),

  // Stats
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalCompletions: integer("total_completions").default(0).notNull(),

  // Order in list
  sortOrder: integer("sort_order").default(0).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// HABIT COMPLETIONS (Daily Log)
// ============================================

export const habitCompletions = pgTable("habit_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  habitId: uuid("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Completion details
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(), // The day/time it was scheduled
  status: completionStatusEnum("status").default("completed").notNull(),

  // Optional notes
  notes: text("notes"),
  mood: integer("mood"), // 1-5 scale

  // If automated
  wasAutomated: boolean("was_automated").default(false).notNull(),
  automationLog: jsonb("automation_log"),

  // Coins earned
  coinsEarned: integer("coins_earned").default(0).notNull(),
});

// ═══════════════════════════════════════════════════════════
// AUTOMATION TABLES
// ═══════════════════════════════════════════════════════════

export const automations = pgTable("automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Metadata
  name: text("name").notNull(),
  description: text("description"),
  taskDescription: text("task_description").notNull(), // Natural language task for browser-use

  // Configuration
  requiresConfirmation: boolean("requires_confirmation")
    .default(false)
    .notNull(),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),

  // Stats
  runCount: integer("run_count").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  avgDurationMs: integer("avg_duration_ms"),
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: text("last_run_status"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// AUTOMATION RUNS (Execution History)
// ============================================

export const automationRuns = pgTable("automation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  automationId: uuid("automation_id")
    .notNull()
    .references(() => automations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Job Info
  jobId: text("job_id").unique(),

  // Status
  status: runStatusEnum("status").default("queued").notNull(),

  // Trigger
  triggeredBy: text("triggered_by").notNull(),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),

  // Execution Context
  context: jsonb("context").default({}).notNull(),

  // Results
  history: jsonb("history").default([]).notNull(),
  screenshots: jsonb("screenshots").default([]).notNull(),
  videoUrl: text("video_url"),

  // Error Handling
  errorMessage: text("error_message"),
  errorCode: text("error_code"),
  retryCount: integer("retry_count").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),

  // Timing
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),

  // Healing & AI
  agentActions: jsonb("agent_actions").default([]),
  healingCost: real("healing_cost").default(0),

  // User Confirmation
  confirmationRequestedAt: timestamp("confirmation_requested_at"),
  confirmationPrompt: text("confirmation_prompt"),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: uuid("confirmed_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// USER CREDENTIALS (Encrypted)
// ============================================

export const userCredentials = pgTable("user_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Service Info
  serviceName: text("service_name").notNull(),
  serviceType: text("service_type"), // 'oauth', 'password', 'api_key'

  // Credentials (encrypted)
  encryptedCredentials: text("encrypted_credentials").notNull(),

  // OAuth specific
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshToken: text("refresh_token"),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastVerifiedAt: timestamp("last_verified_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// COMMUNITY AUTOMATIONS
// ============================================

export const communityAutomations = pgTable("community_automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  automationId: uuid("automation_id")
    .notNull()
    .references(() => automations.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),

  // Publishing
  title: text("title").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  category: text("category").notNull(),
  tags: jsonb("tags").default([]).notNull(),

  // Media
  coverImageUrl: text("cover_image_url"),
  demoVideoUrl: text("demo_video_url"),
  screenshots: jsonb("screenshots").default([]).notNull(),

  // Requirements
  requiredServices: jsonb("required_services").default([]).notNull(),
  requiredPermissions: jsonb("required_permissions").default([]).notNull(),

  // Stats
  installCount: integer("install_count").default(0).notNull(),
  runCount: integer("run_count").default(0).notNull(),
  successRate: integer("success_rate"), // percentage
  avgRating: integer("avg_rating"), // 1-5 scale
  reviewCount: integer("review_count").default(0).notNull(),

  // Status
  status: text("status").default("draft").notNull(), // 'draft', 'published', 'featured', 'archived'
  isVerified: boolean("is_verified").default(false).notNull(),
  featuredAt: timestamp("featured_at"),

  // Version
  version: text("version").default("1.0.0").notNull(),
  changelog: text("changelog"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

// ============================================
// AUTOMATION LOGS (Legacy/Simplified)
// ============================================

// ============================================
// STREAK FREEZES
// ============================================

export const streakFreezes = pgTable("streak_freezes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  habitId: uuid("habit_id").references(() => habits.id, {
    onDelete: "cascade",
  }),

  // Freeze details
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),

  // Cost
  coinsCost: integer("coins_cost").default(50).notNull(),
});

// ============================================
// TRANSACTIONS (Coins)
// ============================================

export const coinTransactions = pgTable("coin_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Transaction details
  amount: integer("amount").notNull(), // Positive for earn, negative for spend
  type: text("type").notNull(), // 'habit_complete', 'purchase', 'streak_freeze', 'bonus'
  description: text("description"),

  // Reference
  referenceType: text("reference_type"), // 'habit', 'subscription', 'streak_freeze'
  referenceId: uuid("reference_id"),

  // Balance after transaction
  balanceAfter: integer("balance_after").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const automationSolutions = pgTable(
  "automation_solutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    errorSignature: text("error_signature").notNull(),
    solutionType: text("solution_type").default("AI_FIX").notNull(),
    solution: jsonb("solution").notNull(), // payload
    contextTags: jsonb("context_tags").default({}), // browser, domain, etc.
    confidenceScore: integer("confidence_score").default(100),
    successCount: integer("success_count").default(0),
    totalCount: integer("total_count").default(1),
    firstUsedAt: timestamp("first_used_at").defaultNow(),
    lastUsedAt: timestamp("last_used_at").defaultNow(),
    createdByGuruId: uuid("created_by_guru_id").references(() => gurus.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    signatureIdx: index("solutions_signature_idx").on(
      table.errorSignature,
      table.confidenceScore,
    ),
  }),
);

export const healingEvents = pgTable(
  "healing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionRunId: uuid("mission_run_id").references(() => missionRuns.id, {
      onDelete: "cascade",
    }),
    errorSignature: text("error_signature").notNull(),
    attemptedFix: jsonb("attempted_fix").notNull(),
    fixType: text("fix_type").notNull(),
    outcome: text("outcome").notNull(), // 'SUCCESS', 'FAILED', 'PARTIAL'
    confidenceUsed: integer("confidence_used"),
    processingTime: integer("processing_time"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    runIdx: index("healing_events_run_idx").on(
      table.missionRunId,
      table.timestamp,
    ),
  }),
);

export const skillPerformanceMetrics = pgTable(
  "skill_performance_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    skillName: text("skill_name").notNull(),
    domain: text("domain"), // optional, can be global
    successCount: integer("success_count").default(0).notNull(),
    totalCount: integer("total_count").default(0).notNull(),
    avgDurationMs: integer("avg_duration_ms").default(0).notNull(),
    confidenceScore: integer("confidence_score").default(80).notNull(),
    isQuarantined: boolean("is_quarantined").default(false).notNull(),
    quarantineSince: timestamp("quarantine_since"),
    lastGlobalSuccessRate: decimal("last_global_success_rate", {
      precision: 5,
      scale: 2,
    })
      .default("1.00")
      .notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    skillDomainIdx: index("skill_performance_skill_domain_idx").on(
      table.skillName,
      table.domain,
    ),
  }),
);

export const globalConfidenceMatrix = pgTable("global_confidence_matrix", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: text("skill_id").notNull().unique(), // Maps to skillName
  confidence: decimal("confidence", { precision: 5, scale: 2 })
    .default("0.50")
    .notNull(),
  avgLatencyMs: integer("avg_latency_ms").default(0).notNull(),
  matrixVersion: integer("matrix_version").default(1).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  gurus: many(userGurus),
  habits: many(habits),
  completions: many(habitCompletions),
  automationRuns: many(automationRuns),
  credentials: many(userCredentials),
  streakFreezes: many(streakFreezes),
  coinTransactions: many(coinTransactions),
  createdGurus: many(gurus),
  createdTemplates: many(guruTemplates),
}));

export const userGurusRelations = relations(userGurus, ({ one }) => ({
  user: one(users, {
    fields: [userGurus.userId],
    references: [users.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  completions: many(habitCompletions),
  streakFreezes: many(streakFreezes),
}));

export const habitCompletionsRelations = relations(
  habitCompletions,
  ({ one }) => ({
    habit: one(habits, {
      fields: [habitCompletions.habitId],
      references: [habits.id],
    }),
    user: one(users, {
      fields: [habitCompletions.userId],
      references: [users.id],
    }),
  }),
);

// ═══════════════════════════════════════════════════════════
// GURU PLATFORM TABLES (Customize Your Guru)
// ═══════════════════════════════════════════════════════════

// Main Gurus Table - The core "Customize Your Guru" entity
export const gurus = pgTable("gurus", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Identity
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  personality: text("personality").notNull(),
  personalityBias: jsonb("personality_bias")
    .$type<{
      riskTolerance: number;
      cautiousness: number;
      experimentalism: number;
    }>()
    .default({
      riskTolerance: 0.5,
      cautiousness: 0.5,
      experimentalism: 0.5,
    })
    .notNull(),

  // Avatar & Branding
  avatarUrl: text("avatar_url"),
  accentColor: text("accent_color").default("#FFD700"),

  // Custom Voice
  systemPrompt: text("system_prompt"),
  sampleMessages: jsonb("sample_messages").$type<string[]>().default([]),

  // Automation References
  automationIds: jsonb("automation_ids")
    .$type<string[]>()
    .notNull()
    .default([]),

  // Status
  enabled: boolean("enabled").default(true).notNull(),

  // Analytics
  totalRuns: integer("total_runs").default(0).notNull(),
  successfulRuns: integer("successful_runs").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),

  // Marketplace
  isTemplate: boolean("is_template").default(false).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  downloads: integer("downloads").default(0).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),

  // Ownership
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Guru Templates (Marketplace)
export const guruTemplates = pgTable("guru_templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),

  previewImage: text("preview_image"),
  demoVideo: text("demo_video"),

  automationTemplate: jsonb("automation_template").notNull(),

  downloads: integer("downloads").default(0).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0).notNull(),

  isPremium: boolean("is_premium").default(false).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),

  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  creatorName: text("creator_name").notNull(),

  tags: jsonb("tags").$type<string[]>().default([]),

  published: boolean("published").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Guru Executions
export const guruExecutions = pgTable("guru_executions", {
  id: uuid("id").primaryKey().defaultRandom(),

  guruId: uuid("guru_id")
    .notNull()
    .references(() => gurus.id, { onDelete: "cascade" }),
  automationId: uuid("automation_id").notNull(),

  triggeredBy: text("triggered_by").notNull(), // 'schedule', 'manual', 'event'

  status: text("status").notNull(), // 'running', 'success', 'failed', 'healed'
  errorMessage: text("error_message"),

  executionTimeMs: integer("execution_time_ms"),

  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// SESSION MASTERY & PERSISTENCE (Phase 6)
// ============================================

// User Profiles - Persistent browser sessions for Gurus
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    guruId: uuid("guru_id")
      .notNull()
      .references(() => gurus.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "gmail-work", "linkedin-personal"
    browserType: text("browser_type").default("chromium").notNull(),
    profilePath: text("profile_path").notNull(), // Absolute path to the profile folder
    isActive: boolean("is_active").default(true).notNull(),
    credentials: jsonb("credentials").default({}), // Credential hints/metadata (never passwords)
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameGuruIdx: index("profiles_name_guru_idx").on(table.guruId, table.name),
  }),
);

// Mission Runs - Enriched execution intelligence (Replaces/Enhances guruExecutions)
export const missionRuns = pgTable("mission_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  guruId: uuid("guru_id")
    .notNull()
    .references(() => gurus.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Status & Timing
  status: runStatusEnum("status").default("queued").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),

  // Intelligence
  summary: text("summary"), // AI-generated mission summary
  screenshotUrls: jsonb("screenshot_urls").$type<string[]>().default([]),
  logEntries: jsonb("log_entries").$type<any[]>().default([]),

  // Memory Snapshot
  findingsMd: text("findings_md"), // Content of findings.md at completion
  taskPlanMd: text("task_plan_md"), // Content of task_plan.md at completion

  // Errors
  errorTrace: text("error_trace"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const healingEventsRelations = relations(healingEvents, ({ one }) => ({
  missionRun: one(missionRuns, {
    fields: [healingEvents.missionRunId],
    references: [missionRuns.id],
  }),
}));

export const automationSolutionsRelations = relations(
  automationSolutions,
  ({ one }) => ({
    guru: one(gurus, {
      fields: [automationSolutions.createdByGuruId],
      references: [gurus.id],
    }),
  }),
);

// Template Reviews
export const guruTemplateReviews = pgTable("guru_template_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => guruTemplates.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for new Guru tables
export const gurusRelations = relations(gurus, ({ one, many }) => ({
  creator: one(users, {
    fields: [gurus.createdBy],
    references: [users.id],
  }),
  executions: many(guruExecutions),
}));

export const guruExecutionsRelations = relations(guruExecutions, ({ one }) => ({
  guru: one(gurus, {
    fields: [guruExecutions.guruId],
    references: [gurus.id],
  }),
}));

export const guruTemplatesRelations = relations(
  guruTemplates,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [guruTemplates.creatorId],
      references: [users.id],
    }),
    reviews: many(guruTemplateReviews),
  }),
);

export const guruTemplateReviewsRelations = relations(
  guruTemplateReviews,
  ({ one }) => ({
    template: one(guruTemplates, {
      fields: [guruTemplateReviews.templateId],
      references: [guruTemplates.id],
    }),
    user: one(users, {
      fields: [guruTemplateReviews.userId],
      references: [users.id],
    }),
  }),
);

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  guru: one(gurus, {
    fields: [userProfiles.guruId],
    references: [gurus.id],
  }),
}));

export const missionRunsRelations = relations(missionRuns, ({ one, many }) => ({
  guru: one(gurus, {
    fields: [missionRuns.guruId],
    references: [gurus.id],
  }),
  user: one(users, {
    fields: [missionRuns.userId],
    references: [users.id],
  }),
  healingEvents: many(healingEvents),
}));

// Guru Automations - Taught skills specifically for Gurus
export const guruAutomations = pgTable("guru_automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  // Metadata
  name: text("name").notNull(),
  description: text("description"),
  taskDescription: text("task_description").notNull(),

  // Link to parent Guru
  guruId: uuid("guru_id").references(() => gurus.id, { onDelete: "cascade" }),

  // Recorded Steps (JSON format mirroring browser-use primitives)
  steps: jsonb("steps").notNull().default([]),

  // Trigger Configuration
  trigger: jsonb("trigger").$type<{
    type: "schedule" | "event" | "manual" | "conditional";
    time?: string;
    days?: string[];
    timezone?: string;
    eventName?: string;
    condition?: string;
  }>(),

  // Notification Settings
  notifications: jsonb("notifications")
    .$type<{
      sendStart: boolean;
      sendComplete: boolean;
      sendErrors: boolean;
      channels: string[];
      quietHours?: [number, number];
    }>()
    .default({
      sendStart: true,
      sendComplete: true,
      sendErrors: true,
      channels: ["push"],
    }),

  // Execution Settings
  executionSettings: jsonb("execution_settings")
    .$type<{
      maxRetries: number;
      retryDelay: number;
      timeout: number;
      enableSelfHealing: boolean;
      enableScreenshots: boolean;
      enableLearning: boolean;
    }>()
    .default({
      maxRetries: 3,
      retryDelay: 5,
      timeout: 300,
      enableSelfHealing: true,
      enableScreenshots: true,
      enableLearning: true,
    }),

  // Execution Tracking
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  runCount: integer("run_count").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  failureCount: integer("failure_count").default(0).notNull(),

  // Streak Tracking
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  streakStarted: timestamp("streak_started"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const guruAutomationsRelations = relations(
  guruAutomations,
  ({ one }) => ({
    user: one(users, {
      fields: [guruAutomations.userId],
      references: [users.id],
    }),
    guru: one(gurus, {
      fields: [guruAutomations.guruId],
      references: [gurus.id],
    }),
  }),
);

// ============================================
// PUSH SUBSCRIPTIONS (Web Push)
// ============================================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").notNull(), // { p256dh: string, auth: string }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  }),
);

// ============================================
// EXPORT ALL
// ============================================

export const schema = {
  users,
  userGurus,
  habits,
  habitCompletions,
  automations,
  automationRuns,
  userCredentials,
  communityAutomations,
  streakFreezes,
  coinTransactions,
  automationSolutions,
  gurus,
  guruTemplates,
  guruExecutions,
  guruTemplateReviews,
  guruAutomations,
  pushSubscriptions,
  userProfiles,
  missionRuns,
  healingEvents,
  skillPerformanceMetrics,
  globalConfidenceMatrix,
};

export default schema;
