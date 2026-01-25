import {
  ActionDecision,
  Archetype,
  ArchetypeStats,
  CognitiveMemory,
  LabeledExample,
  Recommendation,
  SelfAssessment,
} from "./CognitionTypes";
import { SEED_DATASET } from "./SeedDataset";

export class CognitionSystem {
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  private readonly weights = {
    skill_sufficiency: 0.3,
    task_complexity: 0.25,
    recent_success_rate: 0.15,
    tool_benefit: 0.25,
    confidence: 0.05,
  };

  private memory: CognitiveMemory = {
    shortTerm: { history: [] },
    longTerm: {
      BROWSER_HEAVY: {
        count: 0,
        successRate: 0.8,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
      SKILL_HEAVY: {
        count: 0,
        successRate: 0.8,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
      HYBRID: {
        count: 0,
        successRate: 0.8,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
      UNCERTAIN: {
        count: 0,
        successRate: 0.6,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
      ROUTINE: {
        count: 0,
        successRate: 0.9,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
      TIME_SENSITIVE: {
        count: 0,
        successRate: 0.75,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
      FAILURE_RECOVERY: {
        count: 0,
        successRate: 0.5,
        avgDuration: 1000,
        consecutiveFailures: 0,
      },
    },
  };

  // --- 1. Core Cognition Spec ---

  public validateSelfAssessment(obj: any): boolean {
    const keys = [
      "skill_sufficiency",
      "task_complexity",
      "recent_success_rate",
      "tool_benefit",
      "confidence",
      "recommendation",
    ];

    for (const key of keys) {
      if (!(key in obj)) return false;
    }

    const numericKeys = keys.slice(0, 5);
    for (const key of numericKeys) {
      const v = obj[key];
      if (typeof v !== "number" || v < 0 || v > 1) return false;
    }

    const validRec = ["skills", "tools", "both", "seek_guidance"];
    if (!validRec.includes(obj.recommendation)) return false;

    return true;
  }

  // --- 2. Archetypes & Clustering Model ---

  public inferArchetype(a: SelfAssessment): Archetype {
    if (a.confidence < 0.4 && a.task_complexity > 0.75) return "UNCERTAIN";
    if (a.recent_success_rate < 0.5 && a.task_complexity > 0.7)
      return "FAILURE_RECOVERY";
    if (a.tool_benefit > 0.75 && a.task_complexity > 0.7)
      return "BROWSER_HEAVY";
    if (a.skill_sufficiency > 0.8 && a.task_complexity < 0.5) return "ROUTINE";
    if (a.skill_sufficiency > 0.75 && a.tool_benefit < 0.5)
      return "SKILL_HEAVY";
    if (a.skill_sufficiency > 0.6 && a.tool_benefit > 0.6) return "HYBRID";
    return "TIME_SENSITIVE";
  }

  // --- 3. Decision Policy & RL Loop ---

  public computeScore(a: SelfAssessment): number {
    return (
      a.skill_sufficiency * this.weights.skill_sufficiency +
      (1 - a.task_complexity) * this.weights.task_complexity +
      a.recent_success_rate * this.weights.recent_success_rate +
      (1 - a.tool_benefit) * this.weights.tool_benefit +
      a.confidence * this.weights.confidence
    );
  }

  private enforceBehaviors(
    archetype: Archetype,
    assessment: SelfAssessment,
    baseRec: Recommendation,
  ): Recommendation {
    // Behavior 1: Self-Doubt
    if (assessment.confidence < 0.4) return "seek_guidance";

    // Behavior 2: Tool Bias for High Complexity
    if (assessment.task_complexity > 0.8 && assessment.tool_benefit > 0.5)
      return "tools";

    // Behavior 3: Skill Bias for Low Complexity
    if (assessment.task_complexity < 0.4 && assessment.skill_sufficiency > 0.5)
      return "skills";

    // Behavior 4: Hybrid for Mixed Signals
    if (assessment.skill_sufficiency > 0.6 && assessment.tool_benefit > 0.6)
      return "both";

    // Behavior 5: Failure Avoidance
    // (Handled implicitly by score, but could be explicit here)
    if (assessment.recent_success_rate < 0.5 && baseRec !== "seek_guidance") {
      // Downgrade aggression
      if (baseRec === "skills") return "both";
      return baseRec;
    }

    return baseRec;
  }

  private applyPatternRefinement(
    archetype: Archetype,
    currentRec: Recommendation,
    durationVariance: number = 0, // percent difference from baseline
  ): Recommendation {
    const s = this.memory.longTerm[archetype];

    // Rule 1: Success Rate Drops
    if (s.successRate < 0.6 && currentRec === "skills") {
      console.log(
        `[Cognition] Refinement: Downgrading 'skills' -> 'both' due to low archetype success (${s.successRate.toFixed(2)})`,
      );
      return "both";
    }

    // Rule 2: Duration Increases (> 20% vs baseline)
    // Assuming baseline is s.avgDuration for now, but in reality we'd compare recent vs historical avg
    // Here we use the injected variance to simulate this check
    if (durationVariance > 0.2 && currentRec !== "tools") {
      console.log(
        `[Cognition] Refinement: Duration spike detected (+${(durationVariance * 100).toFixed(0)}%). Biasing towards 'tools' for speed.`,
      );
      // If tools are not totally inviable, switch to tools. Otherwise hyrbid.
      // We'll safely switch to 'tools' if it was 'both' or 'skills'
      if (currentRec === "skills") return "both"; // safety step down
      if (currentRec === "both") return "tools";
    }

    // Rule 3: Repeated Failures
    if (s.consecutiveFailures >= 3 && currentRec !== "seek_guidance") {
      console.log(
        `[Cognition] Refinement: Forcing 'seek_guidance' due to 3 consecutive failures.`,
      );
      return "seek_guidance";
    }

    // Rule 4: High Success (> 0.9)
    if (s.successRate > 0.9 && currentRec === "both") {
      console.log(
        `[Cognition] Refinement: Upgrading 'both' -> 'skills' due to high success rate (${s.successRate.toFixed(2)})`,
      );
      return "skills";
    }

    return currentRec;
  }

  public decide(
    assessment: SelfAssessment,
    taskId?: string,
    durationVariance: number = 0,
  ): ActionDecision {
    const actualTaskId = taskId || this.generateId();

    if (!this.validateSelfAssessment(assessment)) {
      throw new Error("Invalid SelfAssessment schema");
    }

    // 1. Cluster
    const archetype = this.inferArchetype(assessment);

    // 2. Compute Score
    const score = this.computeScore(assessment);

    // 3. Initial Baseline Routing
    let rec: Recommendation = "seek_guidance";
    if (score >= 0.75) rec = "skills";
    else if (score >= 0.55) rec = "both";
    else if (score >= 0.4) rec = "tools";
    else rec = "seek_guidance";

    // 4. Enforce Behaviors (Cognitive Rules)
    rec = this.enforceBehaviors(archetype, assessment, rec);

    // 5. Apply Pattern Refinement (RL Memory)
    rec = this.applyPatternRefinement(archetype, rec, durationVariance);

    // 6. Map to Decision
    const actionMap: Record<Recommendation, ActionDecision["action"]> = {
      skills: "use_skills",
      tools: "use_tool",
      both: "hybrid_approach",
      seek_guidance: "seek_guidance",
    };

    const decision: ActionDecision = {
      action: actionMap[rec],
      reason: `Archetype: ${archetype} | Score: ${score.toFixed(2)} | Rule: ${rec}`,
      confidence: assessment.confidence,
      score,
      archetype,
    };

    // 7. Store in Short Term Memory (Pending Outcome)
    this.memory.shortTerm.history.push({
      timestamp: Date.now(),
      taskId: actualTaskId,
      archetype,
      assessment,
      decision,
    });

    // Trim Short Term Memory (keep last 10)
    if (this.memory.shortTerm.history.length > 10) {
      this.memory.shortTerm.history.shift();
    }

    return decision;
  }

  // --- 4. Outcome Observation & Update ---

  public observeOutcome(
    taskId: string,
    success: boolean,
    durationMs: number,
    error?: string,
  ) {
    // Find the task in memory
    const entry = this.memory.shortTerm.history.find(
      (h) => h.taskId === taskId,
    );
    if (!entry) {
      console.warn(
        `[Cognition] Task ${taskId} not found in short-term memory.`,
      );
      return;
    }

    // Update entry
    entry.outcome = { success, duration: durationMs, error };

    // Update Long Term Stats
    this.updateArchetypeStats(entry.archetype, success, durationMs);
  }

  private updateArchetypeStats(
    archetype: Archetype,
    success: boolean,
    durationMs: number,
  ) {
    const s = this.memory.longTerm[archetype];
    s.count += 1;

    const alpha = 0.1; // smoothing
    s.successRate = (1 - alpha) * s.successRate + alpha * (success ? 1 : 0);
    s.avgDuration = (1 - alpha) * s.avgDuration + alpha * durationMs;

    if (success) {
      s.consecutiveFailures = 0;
    } else {
      s.consecutiveFailures += 1;
    }

    // Rule 2: Duration Increases Check (for logging/adjustment in future)
    // In a real system we might adjust weights here if duration spikes
  }

  public getStats(): Record<Archetype, ArchetypeStats> {
    return { ...this.memory.longTerm };
  }

  public getHistory() {
    return this.memory.shortTerm.history;
  }

  // --- 5. Synthetic Generator ---

  private clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
  }

  public synthesizeExample(base: LabeledExample, i: number): LabeledExample {
    const jitter = () => (Math.random() - 0.5) * 0.1;
    const a = base.assessment;

    const newAssessment: SelfAssessment = {
      skill_sufficiency: this.clamp01(a.skill_sufficiency + jitter()),
      task_complexity: this.clamp01(a.task_complexity + jitter()),
      recent_success_rate: this.clamp01(a.recent_success_rate + jitter()),
      tool_benefit: this.clamp01(a.tool_benefit + jitter()),
      confidence: this.clamp01(a.confidence + jitter()),
      recommendation: a.recommendation,
    };

    return {
      ...base,
      id: `${base.id}_synth_${i}`,
      assessment: newAssessment,
    };
  }

  public buildSyntheticTrainingSet(
    seeds: LabeledExample[] = SEED_DATASET,
    perSeed: number = 10,
  ): LabeledExample[] {
    const out: LabeledExample[] = [];
    for (const seed of seeds) {
      out.push(seed);
      for (let i = 0; i < perSeed; i++) {
        out.push(this.synthesizeExample(seed, i));
      }
    }
    return out;
  }
}

export const cognitionSystem = new CognitionSystem();
