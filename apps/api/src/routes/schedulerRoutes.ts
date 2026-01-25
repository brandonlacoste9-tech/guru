import express, { Request, Response } from 'express';
import { schedulerService } from '../services/scheduler.service';

const router = express.Router();

// Get all active scheduled jobs
router.get('/jobs', (req: Request, res: Response) => {
  try {
    const jobs = schedulerService.listJobs();
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Reschedule a guru automation (expects new trigger in body)
router.post('/reschedule/:guruId', async (req: Request, res: Response) => {
  const { guruId } = req.params;
  const { trigger } = req.body;
  if (!trigger) {
    return res.status(400).json({ success: false, error: 'Missing trigger payload' });
  }
  try {
    // Unschedule existing job (if any) then schedule with new trigger
    await schedulerService.unscheduleAutomation(guruId);
    await schedulerService.scheduleAutomation(guruId, trigger);
    res.json({ success: true, message: 'Rescheduled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Pause (unschedule) a guru automation
router.post('/pause/:guruId', async (req: Request, res: Response) => {
  const { guruId } = req.params;
  try {
    await schedulerService.unscheduleAutomation(guruId);
    res.json({ success: true, message: 'Paused successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
