import { Router } from "express";
import { guruService } from "../services/guruService";
import { requireAuth } from "../middleware/requireAuth";

const router: Router = Router();

// Create a new Guru Automation
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, taskDescription, steps, startingUrl, guruId } = req.body;

    if (!name || !taskDescription) {
      return res
        .status(400)
        .json({ error: "Name and Task Description are required" });
    }

    const automation = await guruService.createGuruAutomation(
      {
        name,
        taskDescription,
        steps: steps || [],
        trigger: { type: "manual" }, // Default trigger
        guruId:
          guruId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            guruId,
          )
            ? guruId
            : undefined,
        description: `Automation starting at ${startingUrl || "unknown URL"}`,
      },
      (req as any).user.id,
    );

    res.status(201).json(automation);
  } catch (error: any) {
    console.error("Error creating automation:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
