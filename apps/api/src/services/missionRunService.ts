import { db, missionRuns, eq } from "@guru/database";
import * as fs from "fs";
import * as path from "path";

export class MissionRunService {
  /**
   * Initialize a new mission run
   */
  async createRun(userId: string, guruId: string) {
    const [run] = await db
      .insert(missionRuns)
      .values({
        userId,
        guruId,
        status: "running",
        startedAt: new Date(),
      })
      .returning();
    return run;
  }

  /**
   * Update run status and results
   */
  async updateRun(runId: string, updates: any) {
    const [updated] = await db
      .update(missionRuns)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(missionRuns.id, runId))
      .returning();
    return updated;
  }

  /**
   * Finalize a mission run by capturing the Guru's knowledge snapshot
   */
  async finalizeRun(runId: string, result: any) {
    const [run] = await db
      .select()
      .from(missionRuns)
      .where(eq(missionRuns.id, runId));

    if (!run) return;

    // Resolve memory directory
    const memoryDir = path.join(process.cwd(), "memory", `guru-${run.guruId}`);

    let findingsMd = "";
    let taskPlanMd = "";

    try {
      if (fs.existsSync(path.join(memoryDir, "findings.md"))) {
        findingsMd = fs.readFileSync(
          path.join(memoryDir, "findings.md"),
          "utf-8",
        );
      }
      if (fs.existsSync(path.join(memoryDir, "task_plan.md"))) {
        taskPlanMd = fs.readFileSync(
          path.join(memoryDir, "task_plan.md"),
          "utf-8",
        );
      }
    } catch (e) {
      console.warn(`⚠️ Failed to read memory snapshots for run ${runId}`, e);
    }

    return this.updateRun(runId, {
      status: result.success ? "success" : "failed",
      completedAt: new Date(),
      durationMs: Date.now() - run.startedAt.getTime(),
      summary:
        result.summary || result.text?.substring(0, 500) || "Mission complete.",
      screenshotUrls: result.screenshots || [],
      logEntries: result.toolCalls || [],
      errorTrace: result.error || null,
      findingsMd,
      taskPlanMd,
    });
  }

  /**
   * List recent runs for a Guru
   */
  async listRecentRuns(guruId: string, limit: number = 20) {
    return db
      .select()
      .from(missionRuns)
      .where(eq(missionRuns.id, guruId))
      .orderBy(missionRuns.startedAt)
      .limit(limit);
  }
}

export const missionRunService = new MissionRunService();
