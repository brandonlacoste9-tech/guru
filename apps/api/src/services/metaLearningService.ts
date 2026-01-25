import {
  db,
  skillPerformanceMetrics,
  globalConfidenceMatrix,
  eq,
  and,
  sql,
} from "@guru/database";

export interface ExperienceReport {
  skillName: string;
  domain?: string;
  success: boolean;
  durationMs: number;
}

export class MetaLearningService {
  private inMemoryMetrics: Record<string, number> = {};
  private matrixVersion: number = 0;
  private quarantinedSkills: Set<string> = new Set();
  private globalMatrixCache: Record<string, number> = {};

  async init() {
    await this.refreshLocalCache();
    // In a real production app, we would use a dedicated listener here.
    // For this prototype, we'll refresh every 5 minutes or on demand.
    setInterval(() => this.refreshLocalCache(), 5 * 60 * 1000);
  }

  async refreshLocalCache() {
    try {
      const rows = await db.select().from(globalConfidenceMatrix);
      if (rows.length > 0) {
        this.matrixVersion = rows[0].matrixVersion;
        rows.forEach((r) => {
          this.globalMatrixCache[r.skillId] = Number(r.confidence);
        });
      }
      // Also refresh quarantine list
      const qRows = await db
        .select({ skillName: skillPerformanceMetrics.skillName })
        .from(skillPerformanceMetrics)
        .where(eq(skillPerformanceMetrics.isQuarantined, true));
      this.quarantinedSkills = new Set(qRows.map((r) => r.skillName));
    } catch (e) {}
  }

  /**
   * Records a new experience report and updates global metrics.
   * This uses a moving average for duration and confidence.
   */
  async recordExperience(report: ExperienceReport) {
    const { skillName, domain, success, durationMs } = report;

    // Update in-memory fallback first
    const currentScore = this.inMemoryMetrics[skillName] || 50;
    const scoreAdj = success ? 2 : -5;
    this.inMemoryMetrics[skillName] = Math.min(
      100,
      Math.max(0, currentScore + scoreAdj),
    );

    try {
      // 1. Find existing metrics
      const [existing] = await db
        .select()
        .from(skillPerformanceMetrics)
        .where(
          and(
            eq(skillPerformanceMetrics.skillName, skillName),
            domain
              ? eq(skillPerformanceMetrics.domain, domain)
              : sql`domain IS NULL`,
          ),
        );

      if (existing) {
        // 2. Update existing
        const totalCount = existing.totalCount + 1;
        const successCount = existing.successCount + (success ? 1 : 0);

        // Rolling average for duration
        const alpha = 0.1;
        const newAvgDuration = Math.round(
          (1 - alpha) * existing.avgDurationMs + alpha * durationMs,
        );

        // Calculate basic confidence score (0-100)
        // Adjusts based on success rate and sample size
        const rawSuccessRate = (successCount / totalCount) * 100;
        const maturityBonus = Math.min(20, totalCount * 2); // Confidence grows with usage
        const newConfidence = Math.round(rawSuccessRate * 0.8 + maturityBonus);

        await db
          .update(skillPerformanceMetrics)
          .set({
            successCount,
            totalCount,
            avgDurationMs: newAvgDuration,
            confidenceScore: Math.min(100, Math.max(0, newConfidence)),
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(skillPerformanceMetrics.id, existing.id));
      } else {
        // 3. Create new entry
        await db.insert(skillPerformanceMetrics).values({
          skillName,
          domain: domain || null,
          successCount: success ? 1 : 0,
          totalCount: 1,
          avgDurationMs: durationMs,
          confidenceScore: success ? 85 : 50,
        });
      }
    } catch (error: any) {
      console.error(
        `❌ MetaLearning: Failed to record experience for ${skillName}:`,
        error.message,
      );
    }
  }

  /**
   * Retrieves the current confidence matrix for a set of skills.
   */
  async getConfidenceMatrix(
    skillNames: string[],
  ): Promise<Record<string, number>> {
    if (skillNames.length === 0) return {};

    const matrix: Record<string, number> = {};

    // 1. Use Local Cache if available
    skillNames.forEach((name) => {
      if (this.globalMatrixCache[name]) {
        matrix[name] = this.globalMatrixCache[name];
      }
    });

    // 2. If skills are missing from cache, fetch them (and warm cache)
    const missing = skillNames.filter((name) => !matrix[name]);
    if (missing.length > 0) {
      try {
        const metrics = await db
          .select({
            skillName: skillPerformanceMetrics.skillName,
            confidenceScore: skillPerformanceMetrics.confidenceScore,
          })
          .from(skillPerformanceMetrics)
          .where(
            sql`${skillPerformanceMetrics.skillName} IN (${sql.raw(missing.map((s) => `'${s}'`).join(","))})`,
          );

        metrics.forEach((m) => {
          matrix[m.skillName] = m.confidenceScore;
          this.globalMatrixCache[m.skillName] = m.confidenceScore; // Warm cache
        });
      } catch (error: any) {
        console.warn(
          `⚠️ MetaLearning: DB unavailable, using in-memory session fallback for ${missing.join(", ")}.`,
        );
        missing.forEach((name) => {
          matrix[name] = this.inMemoryMetrics[name] || 50;
        });
      }
    }

    return matrix;
  }

  /**
   * Recomputes the global confidence matrix and flags quarantined skills.
   * Increments matrix_version and triggers pg_notify.
   */
  async recomputeGlobalMatrix() {
    try {
      // 1. Aggregate statistics from granular metrics
      const agg = await db
        .select({
          skillName: skillPerformanceMetrics.skillName,
          attempts: sql<number>`count(*)`,
          successRate: sql<number>`avg(case when success_count > 0 then 1 else 0 end)`,
          avgLatency: sql<number>`avg(avg_duration_ms)`,
        })
        .from(skillPerformanceMetrics)
        .groupBy(skillPerformanceMetrics.skillName);

      const version = Date.now();
      this.matrixVersion = version;

      for (const row of agg) {
        const isQuarantined = row.successRate < 0.3;

        // Update matrix table
        await db
          .insert(globalConfidenceMatrix)
          .values({
            skillId: row.skillName,
            confidence: (row.successRate * 100).toString(),
            avgLatencyMs: Math.round(row.avgLatency),
            matrixVersion: version,
          })
          .onConflictDoUpdate({
            target: globalConfidenceMatrix.skillId,
            set: {
              confidence: (row.successRate * 100).toString(),
              avgLatencyMs: Math.round(row.avgLatency),
              matrixVersion: version,
              updatedAt: new Date(),
            },
          });

        // Update quarantine status in metrics
        await db
          .update(skillPerformanceMetrics)
          .set({
            isQuarantined,
            quarantineSince: isQuarantined ? new Date() : null,
            lastGlobalSuccessRate: row.successRate.toString(),
          })
          .where(eq(skillPerformanceMetrics.skillName, row.skillName));

        if (isQuarantined) this.quarantinedSkills.add(row.skillName);
        else this.quarantinedSkills.delete(row.skillName);
      }

      // Notify other instances
      await db.execute(
        sql`SELECT pg_notify('matrix_updated', ${version.toString()})`,
      );
      console.log(
        `🚀 MetaLearning: Matrix recomputed (v${version}). Quarantined ${this.quarantinedSkills.size} skills.`,
      );
    } catch (error: any) {
      console.error(
        `❌ MetaLearning: Failed to recompute matrix:`,
        error.message,
      );
    }
  }

  async getQuarantinedSkills(): Promise<Set<string>> {
    // If set is empty, try to populate from DB once
    if (this.quarantinedSkills.size === 0) {
      try {
        const rows = await db
          .select({ skillName: skillPerformanceMetrics.skillName })
          .from(skillPerformanceMetrics)
          .where(eq(skillPerformanceMetrics.isQuarantined, true));
        rows.forEach((r) => this.quarantinedSkills.add(r.skillName));
      } catch (e) {}
    }
    return this.quarantinedSkills;
  }
}

export const metaLearningService = new MetaLearningService();
