// ============================================
// FLOGURU DATABASE SCHEMA
// ============================================
// Using Drizzle ORM with Supabase PostgreSQL

import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'unlimited', 'lifetime']);
export const habitFrequencyEnum = pgEnum('habit_frequency', ['daily', 'weekly', 'monthly']);
export const completionStatusEnum = pgEnum('completion_status', ['pending', 'completed', 'skipped', 'failed']);
export const automationTypeEnum = pgEnum('automation_type', ['template', 'recorded', 'custom', 'community']);
export const triggerTypeEnum = pgEnum('trigger_type', ['manual', 'schedule', 'habit_event', 'condition']);
export const runStatusEnum = pgEnum('run_status', ['queued', 'running', 'awaiting_confirmation', 'success', 'failed', 'cancelled', 'timeout']);

// ============================================
// USERS
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  
  // Subscription
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free').notNull(),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  stripeCustomerId: text('stripe_customer_id'),
  
  // Onboarding
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  quizAnswers: jsonb('quiz_answers'),
  
  // Stats
  totalStreakDays: integer('total_streak_days').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  totalHabitsCompleted: integer('total_habits_completed').default(0).notNull(),
  
  // Coins/Gamification
  coins: integer('coins').default(100).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull()
});

// ============================================
// USER GURUS (Many-to-Many)
// ============================================

export const userGurus = pgTable('user_gurus', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  guruId: text('guru_id').notNull(), // References guru-core GURUS
  
  // Is this the user's primary guru?
  isPrimary: boolean('is_primary').default(false).notNull(),
  
  // Guru-specific settings
  settings: jsonb('settings').default({}).notNull(),
  
  // Stats with this guru
  habitsCompleted: integer('habits_completed').default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  
  // Timestamps
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  lastInteractionAt: timestamp('last_interaction_at')
});

// ============================================
// HABITS
// ============================================

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  guruId: text('guru_id').notNull(),
  
  // Habit details
  name: text('name').notNull(),
  emoji: text('emoji').default('✅').notNull(),
  description: text('description'),
  
  // Schedule
  frequency: habitFrequencyEnum('frequency').default('daily').notNull(),
  scheduledTime: text('scheduled_time'), // HH:MM format
  durationMinutes: integer('duration_minutes'),
  
  // Automation
  automatable: boolean('automatable').default(false).notNull(),
  automationId: text('automation_id'),
  automationEnabled: boolean('automation_enabled').default(false).notNull(),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  
  // Stats
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  totalCompletions: integer('total_completions').default(0).notNull(),
  
  // Order in list
  sortOrder: integer('sort_order').default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// HABIT COMPLETIONS (Daily Log)
// ============================================

export const habitCompletions = pgTable('habit_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Completion details
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(), // The day/time it was scheduled
  status: completionStatusEnum('status').default('completed').notNull(),
  
  // Optional notes
  notes: text('notes'),
  mood: integer('mood'), // 1-5 scale
  
  // If automated
  wasAutomated: boolean('was_automated').default(false).notNull(),
  automationLog: jsonb('automation_log'),
  
  // Coins earned
  coinsEarned: integer('coins_earned').default(0).notNull()
});

// ═══════════════════════════════════════════════════════════
// AUTOMATION TABLES
// ═══════════════════════════════════════════════════════════

export const automations = pgTable('automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Metadata
  name: text('name').notNull(),
  description: text('description'),
  taskDescription: text('task_description').notNull(), // Natural language task for browser-use
  
  // Configuration
  requiresConfirmation: boolean('requires_confirmation').default(false).notNull(),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  
  // Stats
  runCount: integer('run_count').default(0).notNull(),
  successCount: integer('success_count').default(0).notNull(),
  avgDurationMs: integer('avg_duration_ms'),
  lastRunAt: timestamp('last_run_at'),
  lastRunStatus: text('last_run_status'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// AUTOMATION RUNS (Execution History)
// ============================================

export const automationRuns = pgTable('automation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Job Info
  jobId: text('job_id').unique(),
  
  // Status
  status: runStatusEnum('status').default('queued').notNull(),
  
  // Trigger
  triggeredBy: text('triggered_by').notNull(),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  
  // Execution Context
  context: jsonb('context').default({}).notNull(),
  
  // Results
  history: jsonb('history').default([]).notNull(),
  screenshots: jsonb('screenshots').default([]).notNull(),
  videoUrl: text('video_url'),
  
  // Error Handling
  errorMessage: text('error_message'),
  errorCode: text('error_code'),
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),
  
  // Timing
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  
  // Healing & AI
  agentActions: jsonb('agent_actions').default([]),
  healingCost: real('healing_cost').default(0),
  
  // User Confirmation
  confirmationRequestedAt: timestamp('confirmation_requested_at'),
  confirmationPrompt: text('confirmation_prompt'),
  confirmedAt: timestamp('confirmed_at'),
  confirmedBy: uuid('confirmed_by').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// USER CREDENTIALS (Encrypted)
// ============================================

export const userCredentials = pgTable('user_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Service Info
  serviceName: text('service_name').notNull(),
  serviceType: text('service_type'), // 'oauth', 'password', 'api_key'
  
  // Credentials (encrypted)
  encryptedCredentials: text('encrypted_credentials').notNull(),
  
  // OAuth specific
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshToken: text('refresh_token'),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastVerifiedAt: timestamp('last_verified_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// COMMUNITY AUTOMATIONS
// ============================================

export const communityAutomations = pgTable('community_automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  
  // Publishing
  title: text('title').notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  category: text('category').notNull(),
  tags: jsonb('tags').default([]).notNull(),
  
  // Media
  coverImageUrl: text('cover_image_url'),
  demoVideoUrl: text('demo_video_url'),
  screenshots: jsonb('screenshots').default([]).notNull(),
  
  // Requirements
  requiredServices: jsonb('required_services').default([]).notNull(),
  requiredPermissions: jsonb('required_permissions').default([]).notNull(),
  
  // Stats
  installCount: integer('install_count').default(0).notNull(),
  runCount: integer('run_count').default(0).notNull(),
  successRate: integer('success_rate'), // percentage
  avgRating: integer('avg_rating'), // 1-5 scale
  reviewCount: integer('review_count').default(0).notNull(),
  
  // Status
  status: text('status').default('draft').notNull(), // 'draft', 'published', 'featured', 'archived'
  isVerified: boolean('is_verified').default(false).notNull(),
  featuredAt: timestamp('featured_at'),
  
  // Version
  version: text('version').default('1.0.0').notNull(),
  changelog: text('changelog'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at')
});

// ============================================
// AUTOMATION LOGS (Legacy/Simplified)
// ============================================

// ============================================
// STREAK FREEZES
// ============================================

export const streakFreezes = pgTable('streak_freezes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  habitId: uuid('habit_id').references(() => habits.id, { onDelete: 'cascade' }),
  
  // Freeze details
  purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Cost
  coinsCost: integer('coins_cost').default(50).notNull()
});

// ============================================
// TRANSACTIONS (Coins)
// ============================================

export const coinTransactions = pgTable('coin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Transaction details
  amount: integer('amount').notNull(), // Positive for earn, negative for spend
  type: text('type').notNull(), // 'habit_complete', 'purchase', 'streak_freeze', 'bonus'
  description: text('description'),
  
  // Reference
  referenceType: text('reference_type'), // 'habit', 'subscription', 'streak_freeze'
  referenceId: uuid('reference_id'),
  
  // Balance after transaction
  balanceAfter: integer('balance_after').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const automationSolutions = pgTable('automation_solutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  errorSignature: text('error_signature').notNull(), // Hash of the error type/message
  solution: jsonb('solution').notNull(), // The fix that worked (tool: args)
  successRate: integer('success_rate').default(100),
  timesUsed: integer('times_used').default(1),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  signatureIdx: index('solutions_signature_idx').on(table.errorSignature),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  gurus: many(userGurus),
  habits: many(habits),
  completions: many(habitCompletions),
  automationLogs: many(automationLogs),
  automationRuns: many(automationRuns),
  credentials: many(userCredentials),
  streakFreezes: many(streakFreezes),
  coinTransactions: many(coinTransactions)
}));

export const userGurusRelations = relations(userGurus, ({ one }) => ({
  user: one(users, {
    fields: [userGurus.userId],
    references: [users.id]
  })
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id]
  }),
  completions: many(habitCompletions),
  streakFreezes: many(streakFreezes)
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id]
  }),
  user: one(users, {
    fields: [habitCompletions.userId],
    references: [users.id]
  })
}));

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
  automationLogs,
  userCredentials,
  communityAutomations,
  streakFreezes,
  coinTransactions,
  automationSolutions
};

export default schema;
