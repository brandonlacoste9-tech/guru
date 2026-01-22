import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';
import { EncryptionService } from './encryptionService';
import { AppEnforcer } from '../managers/AppEnforcer';
import { SolutionHasher } from '../utils/solutionHasher';
import { SocketService } from './socketService';

// Load environment variables from the root .env
// We check if we are in dist/ to adjust path depth
const isDist = __dirname.includes('dist');
const envPath = isDist 
  ? path.join(__dirname, '../../../.env') 
  : path.join(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

// ============================================
// CONFIGURATION
// ============================================

const PYTHON_SIDECAR_URL = process.env.PYTHON_SIDECAR_URL || 'http://localhost:8001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (SUPABASE_URL && !SUPABASE_URL.includes('your-project')) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const redis = (REDIS_URL && !REDIS_URL.includes('your-redis') && process.env.ENABLE_REDIS === 'true') 
  ? new Redis(REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })
  : null;

// Antigravity Gateway Connection (Brain)
let agentClient: OpenAI | null = null;

function initBrain() {
  if (agentClient) return agentClient;
  
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    console.warn("⚠️ GOOGLE_AI_API_KEY missing. Sentinel brain offline.");
    return null;
  }
  
  agentClient = new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });
  
  console.log(`🧠 Sentinel Brain Initialized: ${key.substring(0, 5)}...`);
  return agentClient;
}

// ============================================
// INTERFACES
// ============================================

interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  fixedByAgent?: boolean;
  screenshots?: string[];
  agent_actions?: any[];
  healing_cost?: number;
}

// ============================================
// THE AUTOMATION SERVICE (SELF-HEALING CORE)
// ============================================

export class AutomationService {
  private queue: Queue | null = null;

  constructor() {
    if (redis && process.env.ENABLE_REDIS === 'true') {
      this.queue = new Queue('browser-automations', {
        connection: redis as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      });
      console.log('🚀 Redis Queue initialized.');
      this.initWorker();
    } else {
      console.log('📦 Redis disabled. Using MemoryQueue fallback.');
    }
  }

  /**
   * Initialize BullMQ Worker
   */
  private initWorker() {
    if (!redis) return;

    new Worker(
      'browser-automations',
      async (job: Job) => {
        const { automationId, userId, runId, taskDescription, config } = job.data;
        console.log(`🐝 Processing automation job ${job.id} for run ${runId}`);

        return this.executeWithSelfHealing(
          automationId || 'unnamed-task',
          runId,
          async () => {
             // Main logic: Call Python Sidecar
             const executeRequest = {
                task_description: taskDescription,
                user_id: userId,
                automation_id: automationId,
                run_id: runId,
                config: config || {},
                headless: true,
                llm_provider: config?.llmProvider || 'google',
             };

             const response = await axios.post(`${PYTHON_SIDECAR_URL}/execute`, executeRequest, { timeout: 120000 });
             return response.data;
          }
        );
      },
      { connection: redis as any, concurrency: 5 }
    );
  }

  /**
   * CORE WRAPPER: Self-Healing Protocol
   */
  async executeWithSelfHealing<T>(
    taskName: string,
    runId: string,
    operation: () => Promise<T>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    SocketService.emitStatus(runId, 'running', `Starting legendary task: ${taskName}`);
    
    try {
      console.log(`[${taskName}] 🚀 Starting execution...`);
      const result = await operation();
      
      // Update run record
      if (supabase) {
        await supabase.from('automation_runs').update({
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          output_data: result
        }).eq('id', runId);
      }
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error(`[${taskName}] 💥 FAILED. Engaging Self-Healing Protocol...`, error.message);
      SocketService.emitStatus(runId, 'healing', `💥 Error detected: ${error.message}. Engaging Sentinel...`);
      
      // Mark as healing
      if (supabase) {
        await supabase.from('automation_runs').update({ status: 'healing' }).eq('id', runId);
      }
      
      try {
        // TRIGGER AUTONOMOUS FIX
        const fixResult = await this.triggerSelfCorrection(taskName, runId, error);
        
        if (fixResult.fixed) {
          console.warn(`[${taskName}] 🔄 Fix successful. Retrying operation...`);
          
          try {
            const result = await operation();
            
            if (supabase) {
              await supabase.from('automation_runs').update({
                status: 'success',
                fixed_by_agent: true,
                agent_actions: fixResult.actions,
                healing_cost: fixResult.cost,
                completed_at: new Date().toISOString(),
                duration_ms: Date.now() - startTime,
                output_data: result
              }).eq('id', runId);
            }
            
            return { 
              success: true, 
              data: result, 
              fixedByAgent: true,
              agent_actions: fixResult.actions,
              healing_cost: fixResult.cost,
            };
            
          } catch (retryError: any) {
            console.error(`[${taskName}] 💀 Retry failed after fix.`, retryError.message);
            throw retryError;
          }
        }
        
        // Agent couldn't fix it
        if (supabase) {
          await supabase.from('automation_runs').update({
            status: 'failed',
            error_message: error.message,
            error_stack: error.stack,
            agent_actions: fixResult.actions,
            completed_at: new Date().toISOString(),
          }).eq('id', runId);
        }
        
        return {
          success: false,
          error: error.message,
          agent_actions: fixResult.actions,
        };
        
      } catch (agentError: any) {
        console.error(`[${taskName}] 💀 Self-healing failed.`, agentError.message);
        
        if (supabase) {
          await supabase.from('automation_runs').update({
            status: 'failed',
            error_message: error.message,
            error_stack: error.stack,
            completed_at: new Date().toISOString(),
          }).eq('id', runId);
        }
        
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * THE BRAIN: Agent-Driven Debugging & Repair
   */
  private async triggerSelfCorrection(
    taskName: string,
    runId: string,
    originalError: Error
  ): Promise<{ fixed: boolean; actions: any[]; cost: number }> {
    
    const errorSignature = SolutionHasher.hashError(originalError);
    const actions: any[] = [];

    // CHECK CACHE: Learning Ledger lookup
    if (supabase) {
      const { data: cachedSolution } = await supabase
        .from('automation_solutions')
        .select('*')
        .eq('error_signature', errorSignature)
        .order('success_rate', { ascending: false })
        .limit(1)
        .single();

      if (cachedSolution && cachedSolution.success_rate >= 80) {
        console.log(`🧠 Learning Ledger: Found cached solution for ${originalError.message}. Applying...`);
        SocketService.emitStatus(runId, 'healing', `🧠 Learning Ledger: Found cached solution. Applying fix...`);
        const toolResult = await this.applyCachedSolution(taskName, cachedSolution.solution);
        if (toolResult.success) {
           actions.push({
             toolUsed: 'cached_fix',
             actionTaken: `Applied cached fix: ${JSON.stringify(cachedSolution.solution)}`,
             timestamp: new Date().toISOString(),
           });
           SocketService.emitStatus(runId, 'success', `✅ Cached solution applied successfully!`);
           return { fixed: true, actions };
        }
      }
    }
    
    SocketService.emitStatus(runId, 'healing', `🕵️ No cached solution. Brainstorming new fix with Gemini 1.5 Flash...`);
    
    const systemPrompt = `You are the FloGuru Self-Healing Sentinel.
    
YOUR PROTOCOL:
1. Analyze the stack trace for root cause
2. If missing system dependency (ffmpeg, chrome, python module): Call wiggins_enforce
3. If code/logic error: Use web_search to find StackOverflow/GitHub solutions
4. If configuration issue: Use read_url_content to check documentation
5. Return JSON with: { "fixed": true/false, "action": "description" }

IMPORTANT: Only mark fixed=true if you successfully executed a repair action.`;

    const userPrompt = `FAILED TASK: ${taskName}
RUN ID: ${runId}
ERROR:
${originalError.stack || originalError.message}

Fix this autonomously.`;

    const brain = initBrain();
    let totalCost = 0;
    
    // Preparation for agent thinking
    let conversationMessages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // AGENT LOOP: Increased to 5 iterations for legendary persistence
    for (let iteration = 0; iteration < 5; iteration++) {
      try {
        if (!brain) {
          console.error("Agent brain (Gemini) not configured.");
          break;
        }

        const response = await brain.chat.completions.create({
          model: "gemini-1.5-flash",
          messages: conversationMessages as any,
          tools: [
            {
              type: "function",
              function: {
                name: "wiggins_enforce",
                description: "Install missing system dependencies",
                parameters: {
                  type: "object",
                  properties: {
                    package_name: { type: "string" },
                    ecosystem: { type: "string", enum: ["winget", "npm", "pip", "apt"] }
                  },
                  required: ["package_name"]
                }
              }
            }
          ]
        });

        // Track Cost
        const inputTokens = response.usage?.prompt_tokens || 0;
        const outputTokens = response.usage?.completion_tokens || 0;
        totalCost += (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

        const message = response.choices[0].message;
        const toolCalls = message.tool_calls;
        
        if (!toolCalls || toolCalls.length === 0) {
          try {
            const content = message.content || '{}';
            // Clean up potentially backticked JSON from LLM
            const cleanContent = content.replace(/```json|```/g, '').trim();
            const resultJSON = JSON.parse(cleanContent || '{}');
            
            if (resultJSON.fixed && actions.length > 0) {
               await this.recordSolution(errorSignature, actions[actions.length - 1]);
            }
            return { fixed: resultJSON.fixed || false, actions, cost: totalCost };
          } catch {
            // Handle plain text fixes (sometimes LLM just talks)
            const isFixed = message.content?.toLowerCase().includes('fixed') || message.content?.toLowerCase().includes('success');
            return { fixed: isFixed || false, actions, cost: totalCost };
          }
        }
        
        const toolResults: any[] = [];
        
        for (const tool of toolCalls as any[]) {
          const args = JSON.parse(tool.function.arguments);
          let toolResult: any = null;
          console.log(`[${taskName}] 🔧 Agent executing: ${tool.function.name}`, args);
          SocketService.emitStatus(runId, 'healing', `🔧 Agent executing: ${tool.function.name}`, args);
          
          if (tool.function.name === 'wiggins_enforce') {
            const enforcer = new AppEnforcer();
            toolResult = await enforcer.installPackage(args.package_name, args.ecosystem as any);
            actions.push({
              toolUsed: 'wiggins_enforce',
              packageName: args.package_name,
              ecosystem: args.ecosystem,
              actionTaken: `Installed ${args.package_name} via ${args.ecosystem}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            toolResult = { success: true, message: "Action acknowledged. Sentinel proceeding." };
          }
          
          toolResults.push({
            tool_call_id: tool.id,
            role: 'tool',
            name: tool.function.name,
            content: JSON.stringify(toolResult),
          });
        }
        
        conversationMessages.push(message);
        conversationMessages.push(...toolResults);
      } catch (e) {
        console.error("Error in agent loop:", e);
        break;
      }
    }
    
    return { fixed: false, actions, cost: totalCost };
  }

  /**
   * Queue an automation task
   */
  async queueAutomation(data: { automationId?: string; taskDescription: string; config?: any }) {
    const runId = `run-${Date.now()}`;
    const jobData = {
      ...data,
      userId: 'test-user',
      runId: runId,
    };

    // Create record in Supabase first
    if (supabase) {
      await supabase.from('automation_runs').insert({
        id: runId,
        automation_id: data.automationId,
        user_id: 'test-user',
        status: 'pending',
      });
    }

    if (this.queue) {
      return this.queue.add('execute', jobData);
    }

    // Memory Fallback Execution
    console.log('🏗️ MemoryQueue: Processing job immediately...');
    return this.executeWithSelfHealing(
      data.automationId || 'direct-task',
      runId,
      () => this.executeDirect(jobData)
    );
  }

  /**
   * Apply a cached solution from the Learning Ledger
   */
  private async applyCachedSolution(taskName: string, solution: any): Promise<{ success: boolean }> {
    try {
      const enforcer = new AppEnforcer();
      if (solution.toolUsed === 'wiggins_enforce') {
        const res = await enforcer.installPackage(solution.packageName, solution.ecosystem);
        return { success: res.success };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  /**
   * Record a successful solution in the Learning Ledger
   */
  private async recordSolution(signature: string, action: any) {
    if (!supabase) return;
    
    // Check if it already exists to increment success rate/usage
    const { data: existing } = await supabase
      .from('automation_solutions')
      .select('*')
      .eq('error_signature', signature)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.from('automation_solutions').update({
        times_used: (existing.times_used || 0) + 1,
        last_used_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('automation_solutions').insert({
        error_signature: signature,
        solution: {
          toolUsed: action.toolUsed,
          packageName: action.packageName || (action.actionTaken ? action.actionTaken.split(' ')[1] : ''), 
          ecosystem: action.ecosystem || (action.actionTaken ? action.actionTaken.split('via ')[1] : 'winget'),
        },
        success_rate: 100,
        times_used: 1,
      });
    }
  }

  /**
   * Web search helper
   */
  private async searchWeb(query: string): Promise<string> {
    return `Mock search results for: ${query}`;
  }

  /**
   * Get status of a job
   */
  async getJobStatus(jobId: string) {
    if (this.queue) {
      const job = await this.queue.getJob(jobId);
      if (!job) return null;
      
      const state = await job.getState();
      return {
        id: job.id,
        state,
        result: job.returnvalue,
        failedReason: job.failedReason,
      };
    }
    return null;
  }

  /**
   * Execute directly
   */
  async executeDirect(data: any) {
    const response = await axios.post(`${PYTHON_SIDECAR_URL}/execute`, {
      task_description: data.taskDescription,
      user_id: 'test-user',
      automation_id: data.automationId || 'direct-task',
      config: data.config || {},
      headless: true,
      llm_provider: data.config?.llmProvider || 'google',
    });
    return response.data;
  }
}

export const automationService = new AutomationService();
