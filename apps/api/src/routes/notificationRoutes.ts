import { Router } from "express";
import { db } from "@guru/database";
import { pushSubscriptions } from "@guru/database/src/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Public endpoint for VAPID key
router.get("/vapid-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post("/subscribe", requireAuth, async (req, res) => {
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

router.post("/unsubscribe", requireAuth, async (req, res) => {
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
