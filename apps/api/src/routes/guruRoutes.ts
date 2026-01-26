import { Router } from "express";
import { guruService } from "../services/guruService";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Test endpoint (no auth required) - for deployment verification
router.post("/test/execute", async (req, res) => {
  try {
    const { task, guruId } = req.body;
    console.log(`🎯 Test Guru Execute: ${task} (Guru: ${guruId || "TEST"})`);

    // Simple test response to verify API is working
    res.json({
      success: true,
      message: `Test execution endpoint is working! Task received: ${task}`,
      guru: guruId || "TEST",
      timestamp: new Date().toISOString(),
      note: "This is a test endpoint. Use /api/gurus/:id/execute for production.",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply authentication to all routes below
router.use(requireAuth);

// Guru CRUD
router.post("/", async (req, res) => {
  try {
    const guru = await guruService.createGuru(req.body, (req as any).user.id);
    res.status(201).json(guru);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const gurus = await guruService.listGurus((req as any).user.id, req.query);
    res.json(gurus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Generation Endpoint
router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const { guruGenerator } = await import("../services/GuruGenerator");
    const generatedGuru = await guruGenerator.generateFromPrompt(prompt);
    res.json(generatedGuru);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const guru = await guruService.getGuru(req.params.id, (req as any).user.id);
    res.json(guru);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const guru = await guruService.updateGuru(
      req.params.id,
      (req as any).user.id,
      req.body,
    );
    res.json(guru);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await guruService.deleteGuru(req.params.id, (req as any).user.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manual Trigger
router.post("/:id/execute", async (req, res) => {
  try {
    const { guruExecutorService } =
      await import("../services/guruExecutorService");
    const { automationId, taskDescription } = req.body;

    // If no automationId provided, we'll run a standalone task
    const result = await guruExecutorService.executeGuruAutomation(
      req.params.id,
      automationId || "standalone-task",
      "manual",
      {
        taskDescription,
        profileName: req.body.profileName,
        userId: (req as any).user.id,
      },
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
