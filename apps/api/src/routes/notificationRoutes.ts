import { Router } from "express";
import { db } from "@guru/database";
import { pushSubscriptions } from "@guru/database/src/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Mock auth
const authenticate = (req: any, res: any, next: any) => {
  req.user = { id: "00000000-0000-0000-0000-000000000000" };
  next();
};

router.get("/vapid-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post("/subscribe", authenticate, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    // UPSERT subscription
    // First delete existing for this endpoint if any
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    await db.insert(pushSubscriptions).values({
      userId: (req as any).user.id,
      endpoint,
      keys: keys as any,
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/unsubscribe", authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, (req as any).user.id),
        ),
      );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
