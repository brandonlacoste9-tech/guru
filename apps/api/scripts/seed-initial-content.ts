// import { db } from "../src/index"; // Removed invalid import
// Actually, since this is in apps/api/scripts, we should likely import from @guru/database if possible, or relative path
// But wait, the previous seed.ts was in packages/database/src/seed.ts.
// The plan said apps/api/scripts/seed-initial-content.ts.
// I will try to use the db connection from packages/database if I can import it.
// If not, I'll copy the connection logic.
// Given constraints, I'll copy the connection logic for the script to be standalone-ish or require from the package.

// Let's assume we are running this with ts-node from apps/api.
// and we can import from "@guru/database" if it's built, or relative path to packages.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  gurus,
  guruAutomations,
  users,
  automations,
} from "../../../packages/database/src/schema"; // Relative path to source
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding Top 4 Gurus...");

  const mockUserId = "00000000-0000-0000-0000-000000000000";

  // 1. Ensure mock user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, mockUserId));
  if (existingUser.length === 0) {
    console.log("👤 Creating mock user...");
    await db.insert(users).values({
      id: mockUserId,
      email: "admin@floguru.com",
      name: "FloGuru Admin",
      subscriptionTier: "unlimited",
    });
  }

  // 2. Define the Top 4 Gurus
  const gurusData = [
    {
      name: "Productivity Guru",
      category: "productivity",
      personality:
        "Efficient, structured, and action-oriented. Focuses on 'Do it now' and 'Deep Work'.",
      description:
        "Your daily planner and accountability partner. Helps you master your schedule and crush your tasks.",
      accentColor: "#3b82f6", // Blue
      avatarUrl: "📋",
      systemPrompt:
        "You are the Productivity Guru. You help users plan their day, prioritize tasks, and minimize distractions. Your tone is efficient and motivating.",
      automations: [
        {
          name: "Morning Power Hour Planner",
          taskDescription:
            "Review today's calendar and create a prioritized 60-minute deep work block at 8 AM.",
          trigger: { type: "schedule", time: "07:00" },
          description: "Sets up your most important 60 minutes each morning.",
        },
        {
          name: "Weekly Priority Matrix",
          taskDescription:
            "Generate an Eisenhower Matrix for my week's tasks based on urgency and importance.",
          trigger: { type: "schedule", days: ["0"], time: "18:00" }, // Sunday 6pm
          description:
            "Categorizes tasks into Do Now, Do Next, Delegate, Eliminate.",
        },
        {
          name: "Evening Reflection",
          taskDescription:
            "Summarize completed tasks and list top 3 priorities for tomorrow.",
          trigger: { type: "schedule", time: "20:00" },
          description: "Reviews your day and preps tomorrow's focus areas.",
        },
      ],
    },
    {
      name: "Fitness Guru",
      category: "fitness",
      personality:
        "Energetic, encouraging, and disciplined. Believes movement is medicine.",
      description:
        "Your personal trainer and health advocate. Tracks workouts, recovery, and progress.",
      accentColor: "#f97316", // Orange
      avatarUrl: "🏋️",
      systemPrompt:
        "You are the Fitness Guru. You encourage physical activity, track workouts, and promote healthy habits. Your tone is high-energy and supportive.",
      automations: [
        {
          name: "Personalized Workout",
          taskDescription: "Create a 45-minute full-body workout plan.",
          trigger: { type: "schedule", days: ["1", "3", "5"], time: "06:30" }, // Mon, Wed, Fri
          description: "Creates custom workouts based on your goals.",
        },
        {
          name: "Progress Tracker",
          taskDescription:
            "Prompt for current weight and workout stats, then calculate monthly progress.",
          trigger: { type: "schedule", days: ["1", "15"], time: "09:00" }, // 1st and 15th
          description:
            "Prompts for progress photos and tracks key fitness metrics.",
        },
        {
          name: "Recovery Coach",
          taskDescription:
            "Suggest a 15-minute stretching routine for recovery.",
          trigger: { type: "schedule", days: ["0"], time: "19:00" }, // Sunday
          description: "Sends recovery routines and wellness tips.",
        },
      ],
    },
    {
      name: "Mindfulness Guru",
      category: "mindfulness",
      personality:
        "Calm, gentle, and present. Focuses on breath, grounding, and emotional balance.",
      description:
        "Your calm companion. Helps you breathe, ground yourself, and find peace in chaos.",
      accentColor: "#8b5cf6", // Purple
      avatarUrl: "🧘",
      systemPrompt:
        "You are the Mindfulness Guru. You help users reduce stress, practice gratitude, and stay present. Your tone is soothing and peaceful.",
      automations: [
        {
          name: "Micro-Meditation Reminder",
          taskDescription: "Send a 2-minute breathing exercise.",
          trigger: { type: "schedule", time: "14:00" },
          description:
            "A gentle 2-minute grounding exercise for the afternoon.",
        },
        {
          name: "Daily Mood Check-in",
          taskDescription:
            "Ask 'How are you feeling?' and provide a matching coping strategy.",
          trigger: { type: "schedule", time: "19:00" },
          description:
            "Checks emotional state and provides personalized insights.",
        },
        {
          name: "Digital Sunset Ritual",
          taskDescription: "Guide a 30-minute wind-down routine before bed.",
          trigger: { type: "schedule", time: "21:30" },
          description: "Step-by-step evening routine for relaxation.",
        },
      ],
    },
    {
      name: "Study Guru",
      category: "learning",
      personality:
        "Curious, intellectual, and methodical. loves connecting dots and spaced repetition.",
      description:
        "Your knowledge navigator. Optimizes learning, memorization, and focus.",
      accentColor: "#10b981", // Emerald
      avatarUrl: "📚",
      systemPrompt:
        "You are the Study Guru. You assist with learning, memorization techniques, and organizing knowledge. Your tone is academic yet accessible.",
      automations: [
        {
          name: "Spaced Repetition Session",
          taskDescription:
            "Quiz me on 5 flashcards from my recent study topics.",
          trigger: { type: "schedule", time: "08:00" },
          description:
            "Creates personalized review sessions based on forgetting curves.",
        },
        {
          name: "Article Summarizer",
          taskDescription:
            "Summarize the last article I saved into 3 key takeaways.",
          trigger: { type: "manual" },
          description: "Processes reading materials into digestible summaries.",
        },
        {
          name: "Weekly Knowledge Report",
          taskDescription: "Compile a summary of everything learned this week.",
          trigger: { type: "schedule", days: ["0"], time: "10:00" },
          description: "Integrated knowledge map and learning insights.",
        },
      ],
    },
  ];

  for (const data of gurusData) {
    // 1. Create/Update Guru
    // We use name as a pseudo-unique key for seeding to avoid dupes if run multiple times
    // Realistically we might want to check existing by name for this seed script.

    let guruId: string;

    const existingGuru = await db
      .select()
      .from(gurus)
      .where(eq(gurus.name, data.name));

    if (existingGuru.length > 0) {
      console.log(`♻️ Updating existing Guru: ${data.name}`);
      guruId = existingGuru[0].id;
      await db
        .update(gurus)
        .set({
          description: data.description,
          category: data.category,
          personality: data.personality,
          accentColor: data.accentColor,
          avatarUrl: data.avatarUrl,
          systemPrompt: data.systemPrompt,
          updatedAt: new Date(),
        })
        .where(eq(gurus.id, guruId));
    } else {
      console.log(`✨ Creating new Guru: ${data.name}`);
      const inserted = await db
        .insert(gurus)
        .values({
          name: data.name,
          description: data.description,
          category: data.category,
          personality: data.personality,
          accentColor: data.accentColor,
          avatarUrl: data.avatarUrl,
          systemPrompt: data.systemPrompt,
          createdBy: mockUserId,
          enabled: true,
        })
        .returning({ id: gurus.id });
      guruId = inserted[0].id;
    }

    // 2. Create Automations for this Guru
    for (const auto of data.automations) {
      // Check if automation exists for this guru with this name
      // We need to join or just check automation table if we link it.
      // Wait, guru_automations is the table linked to gurus.
      // schema.ts has `guruAutomations`.

      const existingAuto = await db.select().from(guruAutomations).where(
        eq(guruAutomations.name, auto.name),
        // We should also check guruId but name is unique enough for seed
      );

      // Filter for this specific guru to be safe if names collide across gurus (unlikely in this set)
      const myAuto = existingAuto.find((a) => a.guruId === guruId);

      if (myAuto) {
        console.log(`  - Updating automation: ${auto.name}`);
        await db
          .update(guruAutomations)
          .set({
            description: auto.description,
            taskDescription: auto.taskDescription,
            trigger: auto.trigger as any,
          })
          .where(eq(guruAutomations.id, myAuto.id));
      } else {
        console.log(`  - Creating automation: ${auto.name}`);
        await db.insert(guruAutomations).values({
          guruId: guruId,
          userId: mockUserId, // Owned by admin/system
          name: auto.name,
          description: auto.description,
          taskDescription: auto.taskDescription,
          trigger: auto.trigger as any,
          steps: [], // No steps recorded yet, these are "generative" or "template" automations initially
        });
      }
    }
  }

  console.log("✅ Seeding Complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
