import { Router } from 'express';
import { automationService } from '../services/automationService';
import { execSync } from 'child_process';

const router: Router = Router();

/**
 * Chaos Test: Missing Dependency Trap
 * Triggers an operation that requires ffmpeg.
 */
router.post('/chaos/missing-dep', async (req, res) => {
  const { runId } = req.body;
  
  console.log('🔥 Triggering Chaos Test: Missing Dependency (ffmpeg)');
  
  const result = await automationService.executeWithSelfHealing(
    'FFmpeg_Chaos_Test',
    runId || `chaos-${Date.now()}`,
    async () => {
      // This will fail if ffmpeg is NOT in the path
      const output = execSync('ffmpeg -version', { encoding: 'utf8' });
      return { status: 'Success', output };
    }
  );
  
  res.json(result);
});

/**
 * Chaos Test: Logic Error
 */
router.post('/chaos/logic-error', async (req, res) => {
  const { runId } = req.body;
  
  const result = await automationService.executeWithSelfHealing(
    'Logic_Error_Test',
    runId || `chaos-${Date.now()}`,
    async () => {
      throw new Error("Simulated logic error: Variable 'userData' is undefined.");
    }
  );
  
  res.json(result);
});

export default router;
