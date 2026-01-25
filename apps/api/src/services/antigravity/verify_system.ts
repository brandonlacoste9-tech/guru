import { cognitionSystem } from "./CognitionSystem";
import { SelfAssessment, LabeledExample } from "./CognitionTypes";

console.log("🚀 Starting Unified Cognition Engine Verification...");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Memory & History
const task1: SelfAssessment = {
  skill_sufficiency: 0.9,
  task_complexity: 0.2,
  recent_success_rate: 0.9,
  tool_benefit: 0.1,
  confidence: 0.9,
  recommendation: "skills",
};
// Run decision multiple times
cognitionSystem.decide(task1, "task-1");
cognitionSystem.observeOutcome("task-1", true, 500);

const history = cognitionSystem.getHistory();
console.log(`   History Length: ${history.length}`);
assert(history.length > 0, "History captured");
assert(history[0].outcome?.success === true, "Outcome recorded");

// 2. Behavior 1: Self-Doubt (Confidence < 0.4)
const doubtTask: SelfAssessment = {
  skill_sufficiency: 0.5,
  task_complexity: 0.5,
  recent_success_rate: 0.5,
  tool_benefit: 0.5,
  confidence: 0.3, // Trigger self-doubt
  recommendation: "both", // Should be overridden
};
const doubtDecision = cognitionSystem.decide(doubtTask);
console.log(`   Self-Doubt Action: ${doubtDecision.action}`);
assert(doubtDecision.action === "seek_guidance", "Self-Doubt Triggered");

// 3. Pattern Refinement: Consecutive Failures
// Simulate 3 failures in FAILURE_RECOVERY archetype
console.log("   Simulating 3 failures in FAILURE_RECOVERY...");

// Create a task that maps to FAILURE_RECOVERY
const recoveryEntry: SelfAssessment = {
  skill_sufficiency: 0.5,
  task_complexity: 0.9,
  recent_success_rate: 0.2, // Low success -> FAILURE_RECOVERY
  tool_benefit: 0.8,
  confidence: 0.5,
  recommendation: "tools",
};

// 1
cognitionSystem.decide(recoveryEntry, "fail-1");
cognitionSystem.observeOutcome("fail-1", false, 1000);
// 2
cognitionSystem.decide(recoveryEntry, "fail-2");
cognitionSystem.observeOutcome("fail-2", false, 1000);
// 3
cognitionSystem.decide(recoveryEntry, "fail-3");
cognitionSystem.observeOutcome("fail-3", false, 1000); // 3rd consecutive failure triggers Rule 3 next time

const stats = cognitionSystem.getStats();
console.log(
  `   Consecutive Failures: ${stats.FAILURE_RECOVERY.consecutiveFailures}`,
);

// Now try a task that maps to FAILURE_RECOVERY (The 4th attempt)
const failTask: SelfAssessment = {
  skill_sufficiency: 0.5,
  task_complexity: 0.9,
  recent_success_rate: 0.2,
  tool_benefit: 0.8,
  confidence: 0.5,
  recommendation: "tools",
};
// Should infer FAILURE_RECOVERY
const archetype = cognitionSystem.inferArchetype(failTask);
console.log(`   Inferred Archetype: ${archetype}`);
assert(archetype === "FAILURE_RECOVERY", "Maps to FAILURE_RECOVERY");

const failDecision = cognitionSystem.decide(failTask);
console.log(`   Refined Action: ${failDecision.action}`);
assert(
  failDecision.action === "seek_guidance",
  "Refinement forced seek_guidance",
);

// 4. Pattern Refinement: Duration Spike (> 20%)
console.log("\n   Simulating Duration Spike...");
// Task that usually recommends 'both' or 'skills'
const slowTask: SelfAssessment = {
  skill_sufficiency: 0.7,
  task_complexity: 0.3, // Low complexity -> Skills
  recent_success_rate: 0.8,
  tool_benefit: 0.9,
  confidence: 0.8,
  recommendation: "skills",
};
// Pass durationVariance = 0.3 (30% increase)
const slowDecision = cognitionSystem.decide(slowTask, "slow-1", 0.3);
console.log(`   Slow Decision: ${slowDecision.action}`);
// Should be downgraded from 'skills' -> 'both' or 'both' -> 'tools'
// Base score > 0.75 -> Skills. Duration spike -> Both.
assert(
  slowDecision.action === "hybrid_approach" ||
    slowDecision.action === "use_tool",
  "Duration spike triggered fallback",
);

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
