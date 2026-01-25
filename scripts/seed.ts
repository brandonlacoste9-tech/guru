// scripts/seed.ts
// ---------------------------------------------------------------
// Seed script – creates sample users, gurus, templates, and automations
// ---------------------------------------------------------------
import * as dotenv from 'dotenv';
dotenv.config(); // loads .env from repo root

import { db } from '@guru/database';
import {
  users,
  gurus,
  guruTemplates,
  guruAutomations,
  eq,
  sql,
} from '@guru/database/src/schema';

async function main() {
  // ---- Users -------------------------------------------------
  const [user] = await db
    .insert(users)
    .values({
      email: 'demo@example.com',
      name: 'Demo User',
      avatarUrl: null,
      subscriptionTier: 'free',
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  console.log('Created user:', user.id);

  // ---- Guru Template ------------------------------------------
  const [template] = await db
    .insert(guruTemplates)
    .values({
      name: 'Motivational Coach',
      description: 'A friendly coach that encourages daily habits.',
      category: 'coaching',
      previewImage: null,
      demoVideo: null,
      automationTemplate: {}, // empty placeholder – you can fill later
      downloads: 0,
      rating: sql`0.00`,
      reviewCount: 0,
      isPremium: false,
      price: sql`0.00`,
      creatorId: user.id,
      creatorName: user.name ?? 'Demo User',
      tags: [],
      published: true,
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  console.log('Created template:', template.id);

  // ---- Guru --------------------------------------------------
  const [guru] = await db
    .insert(gurus)
    .values({
      name: 'My First Guru',
      description: 'A simple guru for testing.',
      category: 'coaching',
      personality: 'motivator',
      avatarUrl: null,
      accentColor: '#FFD700',
      systemPrompt: null,
      sampleMessages: [],
      automationIds: [],
      enabled: true,
      totalRuns: 0,
      successfulRuns: 0,
      currentStreak: 0,
      longestStreak: 0,
      isTemplate: false,
      isPublic: false,
      price: sql`0.00`,
      downloads: 0,
      rating: sql`0.00`,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  console.log('Created guru:', guru.id);

  // ---- Automation --------------------------------------------
  const automationTrigger = {
    type: 'schedule',
    time: '09:00', // every day at 09:00 UTC
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    timezone: 'UTC',
  } as const;

  const [automation] = await db
    .insert(guruAutomations)
    .values({
      userId: user.id,
      name: 'Morning Check‑in',
      description: 'Runs a daily habit check‑in automation.',
      taskDescription: 'Check user habits and send reminder if needed.',
      requiresConfirmation: false,
      isActive: true,
      isFavorite: false,
      runCount: 0,
      successCount: 0,
      avgDurationMs: null,
      lastRunAt: null,
      lastRunStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      trigger: automationTrigger,
    })
    .returning();
  console.log('Created automation:', automation.id);

  // Link automation to guru (optional – you can add later via API)
  await db
    .update(gurus)
    .set({ automationIds: sql`array_append(gurus.automation_ids, ${automation.id})` })
    .where(eq(gurus.id, guru.id));

  console.log('Seed complete!');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
