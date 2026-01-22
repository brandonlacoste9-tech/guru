import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { automationService } from '../services/automationService';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// ═══════════════════════════════════════════════════════════
// WORKER DEFINITION
// ═══════════════════════════════════════════════════════════

const worker = new Worker(
  'browser-automations',
  async (job: Job) => {
    const { automationId, userId, runId, taskDescription, config } = job.data;
    
    console.log(`🐝 Worker processing automation ${automationId} (Run: ${runId})`);
    
    // Execute with self-healing wrapper
    const result = await automationService.executeWithSelfHealing(
      automationId || 'background-task',
      runId,
      async () => {
        return await automationService.executeDirect(job.data);
      }
    );
    
    return result;
  },
  {
    connection: redis as any,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🐝 Automation worker started and listening for jobs...');

export default worker;
