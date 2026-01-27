// Scheduler Service – creates cron jobs for Guru automations
// ---------------------------------------------------------------
import { CronJob } from "cron";
import { db, guruAutomations } from "@guru/database";

import { eq, isNotNull } from "drizzle-orm";
import { notificationService } from "./notification.service";

// Simple console logger (replace with your logger if available)
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string, err?: unknown) => console.error(`[ERROR] ${msg}`, err),
  debug: (msg: string) => console.debug(`[DEBUG] ${msg}`),
};

export class SchedulerService {
  private jobs: Map<string, CronJob> = new Map();

  constructor() {
    // Delay initialization to allow DB connection to be ready
    setTimeout(() => {
      this.initialize().catch((e) => logger.error("Scheduler init failed", e));
    }, 2000);
  }

  /** Load all automations with a schedule trigger and create jobs */
  async initialize() {
    logger.info("🕒 Initializing Scheduler Service");
    try {
      const rows = await db
        .select()
        .from(guruAutomations)
        .where(isNotNull(guruAutomations.trigger));

      for (const row of rows) {
        const trigger = row.trigger as {
          type?: string;
          time?: string;
          days?: string[];
          timezone?: string;
        } | null;
        if (trigger && trigger.type === "schedule") {
          await this.scheduleAutomation(row.id, trigger);
        }
      }
      logger.info(`✅ Scheduler loaded ${this.jobs.size} jobs`);
    } catch (err) {
      logger.error("Failed to load scheduled automations", err);
    }
  }

  /** Build a cron expression from the trigger JSON */
  private buildCronExpression(trigger: {
    time?: string;
    days?: string[];
    timezone?: string;
  }): { expr: string; timezone?: string } {
    // Expected fields: time (HH:MM), days (array of strings like 'mon'), timezone (optional)
    const time = trigger.time || "00:00";
    const [hour, minute] = time.split(":").map(Number);
    const days = trigger.days?.join(",") || "*";
    // cron format: second minute hour day month dayOfWeek
    const expr = `0 ${minute} ${hour} * * ${days}`;
    return { expr, timezone: trigger.timezone };
  }

  /** Schedule a single automation */
  async scheduleAutomation(
    automationId: string,
    trigger: { time?: string; days?: string[]; timezone?: string },
  ) {
    const { expr: cronExpr, timezone } = this.buildCronExpression(trigger);

    const job = new CronJob(
      cronExpr,
      async () => {
        logger.info(`⏰ Triggering automation ${automationId}`);
        try {
          // Find the guruId linked to this automation
          const automation = await db
            .select()
            .from(guruAutomations)
            .where(eq(guruAutomations.id, automationId))
            .limit(1);

          const guruId = automation[0]?.guruId;
          const guruName = automation[0]?.name || "Unknown Guru";

          if (guruId) {
            // Import dynamically to avoid circular dependencies
            const { guruExecutorService } =
              await import("./guruExecutorService");

            // Notify Start
            notificationService.sendGuruNotification(guruId, "start", {
              guruName,
            });

            // EXECUTE WITH AI CORE
            const result = await guruExecutorService.executeGuruAutomation(
              guruId,
              automationId,
              "schedule",
            );

            if (result.success) {
              notificationService.sendGuruNotification(guruId, "complete", {
                guruName,
              });
            } else {
              notificationService.sendGuruNotification(guruId, "error", {
                guruName,
                errorMessage: result.error,
              });
            }
          } else {
            logger.warn(`Automation ${automationId} has no guruId`);
          }
        } catch (err) {
          logger.error(`Error triggering automation ${automationId}`, err);
        }
      },
      null,
      false,
      timezone,
    );

    job.start();
    this.jobs.set(automationId, job);
    logger.info(
      `🗓️ Scheduled automation ${automationId} with cron ${cronExpr}` +
        (timezone ? ` in timezone ${timezone}` : ""),
    );
  }

  /** Unschedule a job */
  async unscheduleAutomation(automationId: string) {
    const job = this.jobs.get(automationId);
    if (job) {
      job.stop();
      this.jobs.delete(automationId);
      logger.info(`❌ Unscheduled automation ${automationId}`);
    }
  }

  /** List all active schedules */
  listJobs() {
    return Array.from(this.jobs.entries()).map(([id, job]) => {
      const nextDate = job.nextDate();
      return { id, nextRun: nextDate ? nextDate.toISO() : null };
    });
  }
}

export const schedulerService = new SchedulerService();
