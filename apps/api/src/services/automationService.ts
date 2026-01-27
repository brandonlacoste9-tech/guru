import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import OpenAI from "openai";
import path from "path";
import dotenv from "dotenv";
import { EncryptionService } from "./encryptionService";
import { AppEnforcer } from "../managers/AppEnforcer";
import { SolutionHasher } from "../utils/solutionHasher";
import { SocketService } from "./socketService";
import { browserBridge } from "../lib/ai/browserBridge";
import { hyperHealingOrchestrator } from "./HyperHealingOrchestrator"; // New Import
import fs from "fs/promises";
import { existsSync, readdirSync, statSync } from "fs";

// Load environment variables from the root .env
// We check if we are in dist/ to adjust path depth
const isDist = __dirname.includes("dist");
const envPath = isDist
  ? path.join(__dirname, "../../../.env")
  : path.join(__dirname, "../../../../.env");
dotenv.config({ path: envPath });

// ============================================
// CONFIGURATION
// ============================================

const PYTHON_SIDECAR_URL =
  process.env.PYTHON_SIDECAR_URL || "http://localhost:8001";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && !SUPABASE_URL.includes("your-project")
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

import { redisManager } from "../lib/redis";
import { swarmService, GuruStatus } from "./SwarmService"; // New Import

// Antigravity Gateway Connection (Brain)

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
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  console.log(`🧠 Sentinel Brain Initialized: ${key.substring(0, 5)}...`);
  return agentClient;
}

// ============================================
// INTERFACES
// ============================================

export interface ExecutionResult {
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
    // Determine if Redis is enabled via Env or if redisManager is ready
    if (process.env.ENABLE_REDIS === "true") {
      this.queue = new Queue("browser-automations", {
        connection: redisManager.queueClient as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      });
      console.log("🚀 Redis Queue initialized via RedisManager.");
      this.initWorker();

      // Initialize Swarm
      swarmService
        .init()
        .catch((err) => console.error("Failed to init swarm", err));
    } else {
      console.log("📦 Redis disabled. Using MemoryQueue fallback.");
    }

    // Start the janitor
    this.startJanitor();
  }

  /**
   * Periodically clean up old temp files
   */
  private startJanitor() {
    const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
    const MAX_AGE = 30 * 60 * 1000; // 30 minutes

    setInterval(async () => {
      const tempRoot = path.join(__dirname, "../temp");
      if (!existsSync(tempRoot)) return;

      console.log("🧹 Janitor: Checking for old temp files...");

      try {
        const folders = readdirSync(tempRoot);
        const now = Date.now();

        for (const folder of folders) {
          const folderPath = path.join(tempRoot, folder);
          try {
            const stats = statSync(folderPath);
            if (now - stats.mtimeMs > MAX_AGE) {
              console.log(`🧹 Janitor: Removing old folder ${folder}`);
              await fs.rm(folderPath, { recursive: true, force: true });
            }
          } catch (e) {
            // Stats might fail if folder deleted mid-loop
          }
        }
      } catch (error) {
        console.error("❌ Janitor Error:", error);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Initialize BullMQ Worker
   */
  private initWorker() {
    if (process.env.ENABLE_REDIS !== "true") return;

    new Worker(
      "browser-automations",
      async (job: Job) => {
        const { automationId, userId, runId, taskDescription, config } =
          job.data;
        console.log(`🐝 Processing automation job ${job.id} for run ${runId}`);

        return this.executeWithSelfHealing(
          automationId || "unnamed-task",
          runId,
          async () => {
            // Main logic: Call Browser Bridge
            const result = await browserBridge.executeTask({
              task: taskDescription,
              maxSteps: config?.maxSteps || 20,
              headless: true,
              profileName: config?.profileName,
            });
            return result;
          },
        );
      },
      { connection: redisManager.queueClient as any, concurrency: 5 },
    );
  }

  /**
   * CORE WRAPPER: Self-Healing Protocol
   */
  async executeWithSelfHealing<T>(
    taskName: string,
    runId: string,
    operation: () => Promise<T>,
    options?: { profileName?: string },
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const guruId =
      (options && options.profileName && options.profileName.split("/")[1]) ||
      "unknown-guru";

    // Broadcast START to Swarm
    swarmService
      .broadcastStatus({
        id: guruId,
        name: taskName, // Using taskName as name proxy for now, ideally pass guruName
        state: "running",
        missionId: runId,
        lastSeen: Date.now(),
      })
      .catch((e) => console.error("Swarm broadcast error", e));

    SocketService.emitStatus(
      runId,
      "running",
      `Starting legendary task: ${taskName}`,
    );

    try {
      console.log(`[${taskName}] 🚀 Starting execution...`);
      const result = await operation();

      // Update run record
      if (supabase) {
        await supabase
          .from("automation_runs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            output_data: result,
          })
          .eq("id", runId);
      }

      // Broadcast SUCCESS to Swarm
      swarmService
        .broadcastStatus({
          id: guruId,
          name: taskName,
          state: "completed",
          missionId: runId,
          lastSeen: Date.now(),
        })
        .catch((e) => console.error("Swarm broadcast error", e));

      return { success: true, data: result };
    } catch (error: any) {
      console.error(
        `[${taskName}] 💥 FAILED. Engaging Self-Healing Protocol...`,
        error.message,
      );
      SocketService.emitStatus(
        runId,
        "healing",
        `💥 Error detected: ${error.message}. Engaging Sentinel...`,
      );

      // Broadcast HEALING to Swarm
      swarmService
        .broadcastStatus({
          id: guruId,
          name: taskName,
          state: "healing",
          missionId: runId,
          lastSeen: Date.now(),
        })
        .catch((e) => console.error("Swarm broadcast error", e));

      // Mark as healing
      if (supabase) {
        await supabase
          .from("automation_runs")
          .update({ status: "healing" })
          .eq("id", runId);
      }

      try {
        // TRIGGER HYPER-HEALING ORCHESTRATOR
        const healingContext = {
          error,
          step: { task: taskName }, // Simplified step representation for now
          browserContext: {
            browserType: "chromium",
            userAgent: "unknown", // can be enriched later
          },
          domain: "unknown", // We can parse this from task description or bridge logs in future
          missionRunId: runId,
          guruId:
            (options &&
              options.profileName &&
              options.profileName.split("/")[1]) ||
            "unknown",
        };

        const decision =
          await hyperHealingOrchestrator.orchestrateHealing(healingContext);

        console.log(
          `🛡️ HyperHealing Decision: ${decision.strategy} (${decision.confidence}%) for ${taskName}`,
        );

        if (decision.solution) {
          const startTime = Date.now();
          let result;

          // Apply the fix - for now, re-running the operation is the main "fix" application
          // In a granular step execution, we would modify parameters here.
          // Since we wrap the whole bridge call, we retry the whole block.
          // Future: pass decision.solution to bridge to adjust its params.

          try {
            // If the solution suggests a different task/selector, we'd modify operation parameters
            // For this high-level wrapper, we basically just retry hoping the environment is transient
            // OR we can pass the solution payload to the bridge if we modify executeTask to accept "patches".

            // MVP: If solution exists, we retry ONCE.
            // Real implementation needs to pass `decision` down to the bridge
            result = await operation();

            await hyperHealingOrchestrator.recordHealingEvent(
              runId,
              decision.fingerprint,
              decision.solution,
              "SUCCESS",
              Date.now() - startTime,
            );

            if (supabase) {
              await supabase
                .from("automation_runs")
                .update({
                  status: "success",
                  fixed_by_agent: true,
                  agent_actions: [decision],
                  healing_cost: 0, // calculated later
                  completed_at: new Date().toISOString(),
                  duration_ms: Date.now() - startTime,
                  output_data: result,
                })
                .eq("id", runId);
            }

            return {
              success: true,
              data: result,
              fixedByAgent: true,
              agent_actions: [decision],
            };
          } catch (healError: any) {
            await hyperHealingOrchestrator.recordHealingEvent(
              runId,
              decision.fingerprint,
              decision.solution,
              "FAILED",
              Date.now() - startTime,
            );
            throw healError; // Fall through to ultimate failure
          }
        }

        // If no solution found or confidence too low, we fail.
        throw error;
      } catch (agentError: any) {
        console.error(
          `[${taskName}] 💀 Self-healing failed.`,
          agentError.message,
        );

        if (supabase) {
          await supabase
            .from("automation_runs")
            .update({
              status: "failed",
              error_message: error.message,
              error_stack: error.stack,
              completed_at: new Date().toISOString(),
            })
            .eq("id", runId);
        }

        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Queue an automation task
   */
  async queueAutomation(data: {
    automationId?: string;
    taskDescription: string;
    config?: any;
  }) {
    const runId = `run-${Date.now()}`;
    const jobData = {
      ...data,
      userId: "test-user",
      runId: runId,
    };

    // Create record in Supabase first
    if (supabase) {
      await supabase.from("automation_runs").insert({
        id: runId,
        automation_id: data.automationId,
        user_id: "test-user",
        status: "pending",
      });
    }

    if (this.queue) {
      return this.queue.add("execute", jobData);
    }

    // Memory Fallback Execution
    console.log("🏗️ MemoryQueue: Processing job immediately...");
    return this.executeWithSelfHealing(
      data.automationId || "direct-task",
      runId,
      () => this.executeDirect(jobData),
    );
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
    return browserBridge.executeTask({
      task: data.taskDescription,
      maxSteps: data.config?.maxSteps || 20,
      headless: true,
      profileName: data.config?.profileName,
    });
  }
}

export const automationService = new AutomationService();
