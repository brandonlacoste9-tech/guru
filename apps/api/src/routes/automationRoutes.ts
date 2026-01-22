import { Router } from 'express';
import { automationService } from '../services/automationService';

const router = Router();

// Run an automation
router.post('/run', async (req, res) => {
  try {
    const { automationId, taskDescription, config } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    const job = await automationService.queueAutomation({
      automationId: automationId || 'manual-trigger',
      taskDescription,
      config: config || {}
    });

    res.status(202).json({
      message: 'Automation queued',
      jobId: (job as any)?.id || (job as any)?.runId || 'manual',
      automationId
    });
  } catch (error) {
    console.error('Error queuing automation:', error);
    res.status(500).json({ error: 'Failed to queue automation' });
  }
});

// Get automation status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await automationService.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

export default router;
