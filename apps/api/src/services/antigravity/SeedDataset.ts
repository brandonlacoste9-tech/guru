import { LabeledExample } from "./CognitionTypes";

export const SEED_DATASET: LabeledExample[] = [
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
  {
    id: "ex_004",
    description: "Natural Language Reasoning for policy analysis",
    assessment: {
      skill_sufficiency: 0.86,
      task_complexity: 0.52,
      recent_success_rate: 0.81,
      tool_benefit: 0.36,
      confidence: 0.84,
      recommendation: "skills",
    },
    archetype: "SKILL_HEAVY",
  },

  // C. HYBRID
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

  // D. UNCERTAIN
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

  // E. ROUTINE
  {
    id: "ex_009",
    description: "Repetitive formatting of text blocks",
    assessment: {
      skill_sufficiency: 0.95,
      task_complexity: 0.21,
      recent_success_rate: 0.96,
      tool_benefit: 0.18,
      confidence: 0.94,
      recommendation: "skills",
    },
    archetype: "ROUTINE",
  },

  // F. TIME_SENSITIVE
  {
    id: "ex_010",
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
    id: "ex_011",
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

// Programmatically expand to 50 examples by creating variations of the base seeds
function generateVariations(
  seeds: LabeledExample[],
  targetCount: number,
): LabeledExample[] {
  const result: LabeledExample[] = [...seeds];
  let count = seeds.length;
  let seedIndex = 0;

  // Deterministic pseudo-random for stability (simple LCG)
  let seedVal = 12345;
  const rnd = () => {
    seedVal = (seedVal * 9301 + 49297) % 233280;
    return seedVal / 233280;
  };

  while (count < targetCount) {
    const seed = seeds[seedIndex % seeds.length];
    const jitter = (rnd() - 0.5) * 0.1;
    const newAssessment = { ...seed.assessment };

    // Jitter numeric values within 0-1 range
    (
      [
        "skill_sufficiency",
        "task_complexity",
        "recent_success_rate",
        "tool_benefit",
        "confidence",
      ] as const
    ).forEach((k) => {
      newAssessment[k] = Math.max(0, Math.min(1, newAssessment[k] + jitter));
    });

    result.push({
      ...seed,
      id: `ex_gen_${count + 1}`,
      description: `${seed.description} (Variation ${count})`,
      assessment: newAssessment,
      archetype: seed.archetype,
    });

    count++;
    seedIndex++;
  }
  return result;
}

export const DATASET_50 = generateVariations(SEED_DATASET, 50);
