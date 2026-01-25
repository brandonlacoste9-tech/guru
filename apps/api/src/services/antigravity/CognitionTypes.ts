export type Recommendation = "skills" | "tools" | "both" | "seek_guidance";

export type Archetype =
  | "BROWSER_HEAVY"
  | "SKILL_HEAVY"
  | "HYBRID"
  | "UNCERTAIN"
  | "ROUTINE"
  | "TIME_SENSITIVE"
  | "FAILURE_RECOVERY";

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

export interface ArchetypeStats {
  count: number;
  successRate: number; // moving average
  avgDuration: number; // ms
  consecutiveFailures: number;
}

export interface ActionDecision {
  action: "use_skills" | "use_tool" | "hybrid_approach" | "seek_guidance";
  reason: string;
  confidence: number;
  score: number;
  archetype: Archetype; // Added for context
}

export interface CognitiveMemory {
  shortTerm: {
    history: Array<{
      timestamp: number;
      taskId: string;
      archetype: Archetype;
      assessment: SelfAssessment;
      decision: ActionDecision;
      outcome?: { success: boolean; duration: number; error?: string };
    }>;
  };
  longTerm: Record<Archetype, ArchetypeStats>;
}
