import { db } from "./index";
import { guruTemplates, users } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

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

  // 2. Clear existing templates to avoid duplicates
  await db.delete(guruTemplates);

  const templates = [
    {
      name: "Morning Routine Master",
      description:
        "Your relentless accountability partner for a perfect morning. Books classes, sets alarms, and summaries your day.",
      category: "productivity",
      avatarEmoji: "🌅",
      accentColor: "#FFD700",
      expertise: ["Time Management", "Habit Stacking", "Accountability"],
      published: true,
      featured: true,
      downloads: 1250,
      rating: "4.9",
      price: "0", // Free
      creatorId: mockUserId,
      creatorName: "FloGuru Team",
      automationTemplate: {
        tasks: [
          { name: "Calendar Sync", description: "Sync your daily schedule" },
          { name: "Weather Alert", description: "Check for rain/snow" },
        ],
      },
    },
    {
      name: "Zen Wealth Manager",
      description:
        "Automate your financial mindfulness. Tracks expenses, suggests savings, and reminds you of your long-term goals.",
      category: "finance",
      avatarEmoji: "💰",
      accentColor: "#10B981",
      expertise: ["Budgeting", "Investment Strategy", "Mindful Spending"],
      published: true,
      featured: true,
      downloads: 850,
      rating: "4.8",
      price: "9.99",
      creatorId: mockUserId,
      creatorName: "WealthGuru",
      automationTemplate: {
        tasks: [
          {
            name: "Expense Review",
            description: "Categorize last 24h of spending",
          },
          { name: "Savings Goal", description: "Check progress on house fund" },
        ],
      },
    },
    {
      name: "Iron Will Fitness",
      description:
        "A direct, high-intensity workout coach. Integrates with your health data to push you to your limits.",
      category: "fitness",
      avatarEmoji: "💪",
      accentColor: "#EF4444",
      expertise: ["Strength Training", "Nutrition", "HIIT"],
      published: true,
      featured: false,
      downloads: 3400,
      rating: "4.7",
      price: "0",
      creatorId: mockUserId,
      creatorName: "Coach Iron",
      automationTemplate: {
        tasks: [
          { name: "Gym Booking", description: "Book your preferred time slot" },
          { name: "Macro Tracker", description: "Calculate daily targets" },
        ],
      },
    },
  ];

  for (const template of templates) {
    try {
      await db.insert(guruTemplates).values({
        ...(template as any),
        updatedAt: new Date(),
      });
      console.log(`✅ Seeded template: ${template.name}`);
    } catch (err) {
      console.error(`❌ Failed to seed ${template.name}:`, err);
    }
  }

  console.log("✨ Seeding complete!");
  process.exit(0);
}

seed();
