import { Router } from "express";
import { automationService } from "../services/automationService";

const router = Router();

// Run an automation
router.post("/run", async (req, res) => {
  try {
    const { automationId, taskDescription, config } = req.body;

    if (!taskDescription) {
      return res.status(400).json({ error: "Task description is required" });
    }

    const job = await automationService.queueAutomation({
      automationId: automationId || "manual-trigger",
      taskDescription,
      config: config || {},
    });

    res.status(202).json({
      message: "Automation queued",
      jobId: (job as any)?.id || (job as any)?.runId || "manual",
      automationId,
    });
  } catch (error) {
    console.error("Error queuing automation:", error);
    res.status(500).json({ error: "Failed to queue automation" });
  }
});

// Get automation status
router.get("/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await automationService.getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(status);
  } catch (error) {
    console.error("Error getting job status:", error);
    res.status(500).json({ error: "Failed to get job status" });
  }
});

// Test an automation (synchronous)
router.post("/test", async (req, res) => {
  try {
    const { taskDescription, config } = req.body;

    if (!taskDescription) {
      return res.status(400).json({ error: "Task description is required" });
    }

    console.log(`🐝 UI Test Execution: ${taskDescription}`);

    const result = await automationService.executeDirect({
      taskDescription,
      config: {
        ...config,
        saveScreenshots: true,
      },
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error in automation test:", error);
    res.status(500).json({
      error: "Automation test failed",
      details: error.message,
    });
  }
});

export default router;
