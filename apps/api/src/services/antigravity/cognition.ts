// src/antigravity/cognition.ts
// Antigravity Cognitive Engine — unified, drop-in module for FloGuru

// ---------- Types ----------

export type Recommendation = "skills" | "tools" | "both" | "seek_guidance";

export type Archetype =
  | "BROWSER_HEAVY"
  | "SKILL_HEAVY"
  | "HYBRID"
  | "UNCERTAIN"
  | "ROUTINE"
  | "TIME_SENSITIVE"
  | "FAILURE_RECOVERY";

import { thresholdOptimizer, PersonalityBias } from "./ThresholdOptimizer";
import { metaLearningService } from "../metaLearningService";

export interface SelfAssessment {
  skill_sufficiency: number;
  task_complexity: number;
  recent_success_rate: number;
  tool_benefit: number;
  confidence: number;
  recommendation: Recommendation;
}

export interface LabeledExample {
  id: string;
  description: string;
  assessment: SelfAssessment;
  archetype: Archetype;
}

export interface TaskContext {
  id?: string;
  description: string;
  context?: any;
  availableSkills?: string[];
  personality?: PersonalityBias;
}

export interface ExecutionOutcome {
  success: boolean;
  durationMs: number;
  error?: string;
}

export interface CognitiveDecision {
  assessment: SelfAssessment;
  archetype: Archetype;
  recommendation: Recommendation;
  reason: string;
  score: number;
}

// ---------- Prompts ----------

export const CognitivePrompts = {
  selfAssessment: `
You are the Antigravity Cognitive Engine. Your role is to evaluate an upcoming automation task
before execution. You must return ONLY structured JSON with numeric scores.

Evaluate the task across the five dimensions below. Each dimension must be a number from 1 to 10.

Definitions:
- skill_sufficiency: How capable the assigned Guru is of performing this task. 1=unskilled, 10=expert.
- task_complexity: How difficult or multi-step the task is. 1=trivial, 10=complex.
- recent_success_rate: Probability of success based on recent similar attempts. 1=low, 10=high.
- tool_benefit: Degree to which browser-use/automation tools improve results. 1=minimal, 10=critical.
- confidence: Your internal certainty about this assessment. 1=low, 10=high.

Input:
- Task: "{{TASK_DESCRIPTION}}"
- Guru category: {{GURU_CATEGORY}}
- Guru personality: {{GURU_PERSONALITY}}

Output:
Return ONLY JSON. No commentary.
{
  "skill_sufficiency": <number>,
  "task_complexity": <number>,
  "recent_success_rate": <number>,
  "tool_benefit": <number>,
  "confidence": <number>
}
`,

  reinforcement: `
You are the Antigravity Cognitive Engine. Your role is to update internal reinforcement
memory based on the outcome of a completed automation task.

Input:
- Task: {{TASK_DESCRIPTION}}
- Assessment: {{ASSESSMENT_JSON}}
- Decision: {{DECISION_JSON}}
- Outcome: {{OUTCOME_JSON}}

Output:
Return ONLY JSON.
{
  "summary": "<one-sentence reflection>",
  "adjust_weights": {
    "skill_sufficiency": <number -1 to 1>,
    "task_complexity": <number -1 to 1>,
    "recent_success_rate": <number -1 to 1>,
    "tool_benefit": <number -1 to 1>,
    "confidence": <number -1 to 1>
  }
}
`,
};

export function fillPrompt(
  template: string,
  vars: Record<string, any>,
): string {
  let prompt = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key.toUpperCase()}}}`;
    prompt = prompt.replace(
      new RegExp(placeholder, "g"),
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  }
  return prompt;
}

// ---------- Utils ----------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ---------- Validation ----------

export function validateSelfAssessment(obj: any): obj is SelfAssessment {
  const keys: (keyof SelfAssessment)[] = [
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

  for (const key of keys.slice(0, 5)) {
    const v = obj[key as keyof SelfAssessment];
    if (typeof v !== "number" || v < 0 || v > 1) return false;
  }

  const validRec: Recommendation[] = [
    "skills",
    "tools",
    "both",
    "seek_guidance",
  ];
  if (!validRec.includes(obj.recommendation)) return false;

  return true;
}

// ---------- Archetype Inference (Clustering) ----------

export function inferArchetype(a: SelfAssessment): Archetype {
  if (a.confidence < 0.4 && a.task_complexity > 0.75) return "UNCERTAIN";
  if (a.recent_success_rate < 0.5 && a.task_complexity > 0.7)
    return "FAILURE_RECOVERY";
  if (a.tool_benefit > 0.75 && a.task_complexity > 0.7) return "BROWSER_HEAVY";
  if (a.skill_sufficiency > 0.8 && a.task_complexity < 0.5) return "ROUTINE";
  if (a.skill_sufficiency > 0.75 && a.tool_benefit < 0.5) return "SKILL_HEAVY";
  if (a.skill_sufficiency > 0.6 && a.tool_benefit > 0.6) return "HYBRID";
  return "TIME_SENSITIVE";
}

// ---------- Decision Policy ----------

const WEIGHTS = {
  skill_sufficiency: 0.3,
  task_complexity: 0.25,
  recent_success_rate: 0.15,
  tool_benefit: 0.25,
  confidence: 0.05,
};

export function computeScore(a: SelfAssessment): number {
  return (
    a.skill_sufficiency * WEIGHTS.skill_sufficiency +
    (1 - a.task_complexity) * WEIGHTS.task_complexity +
    a.recent_success_rate * WEIGHTS.recent_success_rate +
    (1 - a.tool_benefit) * WEIGHTS.tool_benefit +
    a.confidence * WEIGHTS.confidence
  );
}

// ---------- Reinforcement & Stats ----------

type ArchetypeStats = {
  count: number;
  successRate: number; // moving average
  avgDuration: number; // ms
  consecutiveFailures: number;
};

const archetypeStats: Record<Archetype, ArchetypeStats> = {
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
    avgDuration: 800,
    consecutiveFailures: 0,
  },
  TIME_SENSITIVE: {
    count: 0,
    successRate: 0.75,
    avgDuration: 900,
    consecutiveFailures: 0,
  },
  FAILURE_RECOVERY: {
    count: 0,
    successRate: 0.5,
    avgDuration: 1200,
    consecutiveFailures: 0,
  },
};

export function updateStats(archetype: Archetype, outcome: ExecutionOutcome) {
  const s = archetypeStats[archetype];
  s.count += 1;
  const alpha = 0.1;
  s.successRate =
    (1 - alpha) * s.successRate + alpha * (outcome.success ? 1 : 0);
  s.avgDuration = (1 - alpha) * s.avgDuration + alpha * outcome.durationMs;

  if (outcome.success) {
    s.consecutiveFailures = 0;
  } else {
    s.consecutiveFailures += 1;
  }
}

export function adjustRecommendationForArchetype(
  archetype: Archetype,
  baseRec: Recommendation,
  durationVariance: number = 0,
): { rec: Recommendation; ruleApplied?: string } {
  const s = archetypeStats[archetype];

  // Rule 1: Success Rate Drops
  if (s.successRate < 0.6 && baseRec === "skills") {
    return { rec: "both", ruleApplied: "Low Archetype Success" };
  }

  // Rule 2: Duration Increases (> 20%)
  if (durationVariance > 0.2 && baseRec !== "tools") {
    if (baseRec === "skills")
      return { rec: "both", ruleApplied: "Duration Spike" };
    if (baseRec === "both")
      return { rec: "tools", ruleApplied: "Duration Spike" };
  }

  // Rule 3: Repeated Failures
  if (s.consecutiveFailures >= 3 && baseRec !== "seek_guidance") {
    return { rec: "seek_guidance", ruleApplied: "Consecutive Failures" };
  }

  // Rule 4: High Success (> 0.9)
  if (s.successRate > 0.9 && baseRec === "both") {
    return { rec: "skills", ruleApplied: "High Success Rate" };
  }

  return { rec: baseRec };
}

// ---------- Short-Term Memory ----------

interface HistoryEntry {
  assessment: SelfAssessment;
  archetype: Archetype;
  decision: CognitiveDecision;
  outcome?: ExecutionOutcome;
  timestamp: number;
  taskId: string;
}

const lastHistory: HistoryEntry[] = [];
const MEMORY_LIMIT = 10;

function pushWithLimit<T>(arr: T[], value: T) {
  arr.push(value);
  if (arr.length > MEMORY_LIMIT) arr.shift();
}

// ---------- Seed Examples ----------

export const seedExamples: LabeledExample[] = [
  // A. BROWSER_HEAVY
  {
    id: "ex_001",
    description: "Dynamic dashboard login with 2FA and redirects",
    assessment: {
      skill_sufficiency: 0.39,
      task_complexity: 0.91,
      recent_success_rate: 0.58,
      tool_benefit: 0.94,
      confidence: 0.64,
      recommendation: "tools",
    },
    archetype: "BROWSER_HEAVY",
  },
  {
    id: "ex_002",
    description: "Multi-step form submission with validation errors",
    assessment: {
      skill_sufficiency: 0.47,
      task_complexity: 0.84,
      recent_success_rate: 0.61,
      tool_benefit: 0.89,
      confidence: 0.69,
      recommendation: "tools",
    },
    archetype: "BROWSER_HEAVY",
  },
  // B. SKILL_HEAVY
  {
    id: "ex_003",
    description: "PDF parsing and summarization for a report",
    assessment: {
      skill_sufficiency: 0.92,
      task_complexity: 0.41,
      recent_success_rate: 0.88,
      tool_benefit: 0.27,
      confidence: 0.91,
      recommendation: "skills",
    },
    archetype: "SKILL_HEAVY",
  },
  // C. ROUTINE
  {
    id: "ex_004",
    description: "Data cleanup and normalization for CSV export",
    assessment: {
      skill_sufficiency: 0.89,
      task_complexity: 0.33,
      recent_success_rate: 0.93,
      tool_benefit: 0.22,
      confidence: 0.9,
      recommendation: "skills",
    },
    archetype: "ROUTINE",
  },
  // D. HYBRID
  {
    id: "ex_005",
    description: "Multi-file dependency mapping in a codebase",
    assessment: {
      skill_sufficiency: 0.73,
      task_complexity: 0.83,
      recent_success_rate: 0.69,
      tool_benefit: 0.76,
      confidence: 0.74,
      recommendation: "both",
    },
    archetype: "HYBRID",
  },
  {
    id: "ex_006",
    description: "Research then automate browser actions based on findings",
    assessment: {
      skill_sufficiency: 0.71,
      task_complexity: 0.81,
      recent_success_rate: 0.67,
      tool_benefit: 0.79,
      confidence: 0.73,
      recommendation: "both",
    },
    archetype: "HYBRID",
  },
  // E. UNCERTAIN
  {
    id: "ex_007",
    description: "Unknown API integration with unclear docs",
    assessment: {
      skill_sufficiency: 0.31,
      task_complexity: 0.93,
      recent_success_rate: 0.46,
      tool_benefit: 0.54,
      confidence: 0.37,
      recommendation: "seek_guidance",
    },
    archetype: "UNCERTAIN",
  },
  {
    id: "ex_008",
    description: "Ambiguous user instructions for a complex workflow",
    assessment: {
      skill_sufficiency: 0.42,
      task_complexity: 0.77,
      recent_success_rate: 0.51,
      tool_benefit: 0.48,
      confidence: 0.43,
      recommendation: "seek_guidance",
    },
    archetype: "UNCERTAIN",
  },
  // F. TIME_SENSITIVE
  {
    id: "ex_009",
    description: "Urgent browser automation under time pressure",
    assessment: {
      skill_sufficiency: 0.53,
      task_complexity: 0.82,
      recent_success_rate: 0.63,
      tool_benefit: 0.88,
      confidence: 0.7,
      recommendation: "tools",
    },
    archetype: "TIME_SENSITIVE",
  },
  // G. FAILURE_RECOVERY
  {
    id: "ex_010",
    description: "Recent failures detected in similar scraping tasks",
    assessment: {
      skill_sufficiency: 0.57,
      task_complexity: 0.81,
      recent_success_rate: 0.32,
      tool_benefit: 0.74,
      confidence: 0.44,
      recommendation: "tools",
    },
    archetype: "FAILURE_RECOVERY",
  },
];

// ---------- Synthetic Training Set Generator ----------

export function synthesizeExample(
  base: LabeledExample,
  i: number,
): LabeledExample {
  const jitter = () => (Math.random() - 0.5) * 0.1; // ~±0.05
  const a = base.assessment;

  const newAssessment: SelfAssessment = {
    skill_sufficiency: clamp01(a.skill_sufficiency + jitter()),
    task_complexity: clamp01(a.task_complexity + jitter()),
    recent_success_rate: clamp01(a.recent_success_rate + jitter()),
    tool_benefit: clamp01(a.tool_benefit + jitter()),
    confidence: clamp01(a.confidence + jitter()),
    recommendation: a.recommendation,
  };

  return {
    ...base,
    id: `${base.id}_synth_${i}`,
    assessment: newAssessment,
  };
}

export function buildSyntheticTrainingSet(
  seeds: LabeledExample[],
  perSeed: number,
): LabeledExample[] {
  const out: LabeledExample[] = [];
  for (const seed of seeds) {
    out.push(seed);
    for (let i = 0; i < perSeed; i++) {
      out.push(synthesizeExample(seed, i));
    }
  }
  return out;
}

// ---------- Unified Cognitive Loop ----------

export class AntigravityCognitiveEngine {
  public readonly version = "1.0-unified";

  getArchetypeStats() {
    return archetypeStats;
  }

  getRecentHistory() {
    return lastHistory;
  }

  // --- Decision Logic ---

  private enforceBehaviors(
    assessment: SelfAssessment,
    baseRec: Recommendation,
  ): Recommendation {
    if (assessment.confidence < 0.4) return "seek_guidance";
    if (assessment.task_complexity > 0.8 && assessment.tool_benefit > 0.5)
      return "tools";
    if (assessment.task_complexity < 0.4 && assessment.skill_sufficiency > 0.5)
      return "skills";
    if (assessment.skill_sufficiency > 0.6 && assessment.tool_benefit > 0.6)
      return "both";
    return baseRec;
  }

  // Main entry point
  async decideForTask(
    task: TaskContext,
    assessment: SelfAssessment,
    durationVariance: number = 0,
  ): Promise<CognitiveDecision> {
    const taskId = task.id || generateId();

    // 0. Incorporate Global Meta-Learning & Quarantine
    let globalConfidenceAdjustment = 1.0;
    let filteredSkills = task.availableSkills || [];

    if (task.availableSkills && task.availableSkills.length > 0) {
      // 0a. Skill Quarantine - Filter out globally unstable skills
      const quarantinedSet = await metaLearningService.getQuarantinedSkills();
      filteredSkills = task.availableSkills.filter(
        (skill: string) => !quarantinedSet.has(skill),
      );

      if (filteredSkills.length < task.availableSkills.length) {
        console.warn(
          `🛡️ [Cognition] Quarantine: Blocked unstable skills: ${task.availableSkills.filter((s: string) => !filteredSkills.includes(s)).join(", ")}`,
        );
      }

      // 0b. Shared Intelligence - Adjust scores based on global history
      const matrix =
        await metaLearningService.getConfidenceMatrix(filteredSkills);
      const scores = Object.values(matrix);
      if (scores.length > 0) {
        const avgGlobalScore =
          scores.reduce((a, b) => a + b, 0) / scores.length;
        // Map 0-100 global score to 0.8-1.2 adjustment multiplier
        globalConfidenceAdjustment = 0.8 + (avgGlobalScore / 100) * 0.4;
      }
    }

    const safeAssessment: SelfAssessment = {
      ...assessment,
      skill_sufficiency: clamp01(
        assessment.skill_sufficiency * globalConfidenceAdjustment,
      ),
      task_complexity: clamp01(assessment.task_complexity),
      recent_success_rate: clamp01(
        assessment.recent_success_rate * globalConfidenceAdjustment,
      ),
      tool_benefit: clamp01(assessment.tool_benefit),
      confidence: clamp01(assessment.confidence),
    };

    if (!validateSelfAssessment(safeAssessment)) {
      throw new Error("Invalid self-assessment payload");
    }

    // 1. Cluster
    const archetype = inferArchetype(safeAssessment);

    // 2. Base Score & Routing
    const score = computeScore(safeAssessment);
    const currentThresholds = thresholdOptimizer.getThresholds();

    let rec: Recommendation = "seek_guidance";
    if (score >= currentThresholds.skillConfidence) rec = "skills";
    else if (score >= currentThresholds.hybridBalance) rec = "both";
    else if (score >= currentThresholds.toolNecessity) rec = "tools";
    else rec = "seek_guidance";

    // 3. Enforce Cognitive Behaviors
    rec = this.enforceBehaviors(safeAssessment, rec);

    // 4. Pattern Refinement (RL)
    const refinement = adjustRecommendationForArchetype(
      archetype,
      rec,
      durationVariance,
    );
    const finalRec = refinement.rec;

    const decision: CognitiveDecision = {
      assessment: safeAssessment,
      archetype,
      recommendation: finalRec,
      score: parseFloat(score.toFixed(2)),
      reason: `Score: ${score.toFixed(2)} | Rule: ${refinement.ruleApplied || "Base Policy"}`,
    };

    // 5. Short Term Memory
    pushWithLimit(lastHistory, {
      assessment: safeAssessment,
      archetype,
      decision,
      timestamp: Date.now(),
      taskId,
    });

    return decision;
  }

  // Call this after execution to update learning.
  async recordOutcome(taskId: string, outcome: ExecutionOutcome) {
    // Find task in history
    const entry = lastHistory.find((h) => h.taskId === taskId);
    if (!entry) {
      console.warn(
        `[Cognition] recordOutcome: Task ${taskId} not found in STM. Stats not updated.`,
      );
      return;
    }

    entry.outcome = outcome;
    updateStats(entry.archetype, outcome);

    // Dynamic Calibration: After a few stats have accumulated, adjust thresholds
    if (archetypeStats[entry.archetype].count % 5 === 0) {
      await thresholdOptimizer.adjustThresholds(archetypeStats);
    }
  }
}

export const cognitiveEngine = new AntigravityCognitiveEngine();
