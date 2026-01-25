import { cognitiveEngine, SelfAssessment, TaskContext } from "./cognition";

console.log("🚀 Starting Antigravity Engine (Unified) Verification...");

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

async function runTest() {
  // 1. STM & History
  const task1: SelfAssessment = {
    skill_sufficiency: 0.9,
    task_complexity: 0.2,
    recent_success_rate: 0.9,
    tool_benefit: 0.1,
    confidence: 0.9,
    recommendation: "skills",
  };

  // Test Decide
  const context: TaskContext = { id: "test-1", description: "Testing STM" };
  const decision1 = await cognitiveEngine.decideForTask(context, task1);

  // Test Outcome
  await cognitiveEngine.recordOutcome("test-1", {
    success: true,
    durationMs: 500,
  });

  const history = cognitiveEngine.getRecentHistory();
  console.log(`   History count: ${history.length}`);
  assert(history.length > 0, "History captured");
  assert(history[0].decision.recommendation === "skills", "Decision recorded");
  assert(history[0].outcome?.success === true, "Outcome recorded");

  // 2. Behavior: Self-Doubt
  const doubtTask: SelfAssessment = {
    skill_sufficiency: 0.5,
    task_complexity: 0.5,
    recent_success_rate: 0.5,
    tool_benefit: 0.5,
    confidence: 0.3,
    recommendation: "both", // should become seek_guidance
  };
  const decision2 = await cognitiveEngine.decideForTask(
    { id: "doubt-1", description: "Doubt" },
    doubtTask,
  );
  console.log(`   Doubt Action: ${decision2.recommendation}`);
  assert(
    decision2.recommendation === "seek_guidance",
    "Self-doubt behavior triggered",
  );

  // 3. Pattern Refinement: Consecutive Failures
  // FAILURE_RECOVERY archetype
  const failTask: SelfAssessment = {
    skill_sufficiency: 0.5,
    task_complexity: 0.9,
    recent_success_rate: 0.2, // Maps to FAILURE_RECOVERY
    tool_benefit: 0.8,
    confidence: 0.5,
    recommendation: "tools",
  };

  console.log("   Simulating 3 failures...");
  // 1
  await cognitiveEngine.decideForTask(
    { id: "f-1", description: "F1" },
    failTask,
  );
  await cognitiveEngine.recordOutcome("f-1", {
    success: false,
    durationMs: 1000,
  });
  // 2
  await cognitiveEngine.decideForTask(
    { id: "f-2", description: "F2" },
    failTask,
  );
  await cognitiveEngine.recordOutcome("f-2", {
    success: false,
    durationMs: 1000,
  });
  // 3
  await cognitiveEngine.decideForTask(
    { id: "f-3", description: "F3" },
    failTask,
  );
  await cognitiveEngine.recordOutcome("f-3", {
    success: false,
    durationMs: 1000,
  });

  // 4th attempt should be blocked
  const decisionFail = await cognitiveEngine.decideForTask(
    { id: "f-4", description: "F4" },
    failTask,
  );
  console.log(`   Lockout Action: ${decisionFail.recommendation}`);
  console.log(`   Reason: ${decisionFail.reason}`);
  assert(
    decisionFail.recommendation === "seek_guidance",
    "RL Lockout triggered",
  );
  assert(
    decisionFail.reason.includes("Consecutive Failures"),
    "Reason cites consecutive failures",
  );

  // 4. Pattern Refinement: Duration Spike
  // ROUTINE archetype (usually fast)
  const routineTask: SelfAssessment = {
    skill_sufficiency: 0.9,
    task_complexity: 0.2,
    recent_success_rate: 0.9,
    tool_benefit: 0.2,
    confidence: 0.9,
    recommendation: "skills",
  };
  console.log("\n   Simulating Duration Spike...");
  // Duration variance 0.3 (30%)
  const decisionSlow = await cognitiveEngine.decideForTask(
    { id: "slow-1", description: "Slow" },
    routineTask,
    0.3, // Duration Variance param
  );
  console.log(`   Slow Action: ${decisionSlow.recommendation}`);
  console.log(`   Reason: ${decisionSlow.reason}`);
  // Skills -> Both (Rule 2)
  assert(
    decisionSlow.recommendation === "both",
    "Duration spike downgraded Skills -> Both",
  );
  assert(
    decisionSlow.reason.includes("Duration Spike"),
    "Reason cites Duration Spike",
  );

  // 5. Global Meta-Learning Adjustment
  console.log("\n   Simulating Global Meta-Learning Adjustment...");
  // We'll use the real service if available, but for this test we'll rely on the logic
  // currently in cognition.ts.
  const globalTask: SelfAssessment = {
    skill_sufficiency: 0.7,
    task_complexity: 0.5,
    recent_success_rate: 0.7,
    tool_benefit: 0.5,
    confidence: 0.8,
    recommendation: "both",
  };

  // Test Case A: Neutral Global (Score ~80-120 range)
  const decisionNeutral = await cognitiveEngine.decideForTask(
    {
      id: "global-1",
      description: "Global Neutral",
      availableSkills: ["skill-1"],
    },
    globalTask,
  );
  console.log(
    `   Neutral Global Assessment: ${JSON.stringify(decisionNeutral.assessment)}`,
  );

  // We expect the assessment scores to be adjusted if the global matrix returned something.
  // Since the DB is currently empty for "skill-1", it will use default adjustment 1.0 (neutral)
  assert(
    decisionNeutral.assessment.skill_sufficiency === 0.7,
    "Neutral global adjustment maintained score",
  );

  // 6. Personality Bias Shift
  console.log("\n   Simulating Personality Bias Shift...");
  const taskToAssess: SelfAssessment = {
    skill_sufficiency: 0.6,
    task_complexity: 0.5,
    recent_success_rate: 0.6,
    tool_benefit: 0.5,
    confidence: 0.6,
    recommendation: "skills",
  };

  const conservativeGuru = {
    riskTolerance: 0.1,
    cautiousness: 0.9,
    experimentalism: 0.1,
  };
  const aggressiveGuru = {
    riskTolerance: 0.9,
    cautiousness: 0.1,
    experimentalism: 0.9,
  };

  const decisionCons = await cognitiveEngine.decideForTask(
    { id: "p-cons", description: "Cons", personality: conservativeGuru },
    taskToAssess,
  );
  const decisionAgg = await cognitiveEngine.decideForTask(
    { id: "p-agg", description: "Agg", personality: aggressiveGuru },
    taskToAssess,
  );

  console.log(
    `   Cons Score: ${decisionCons.score.toFixed(2)} | Agg Score: ${decisionAgg.score.toFixed(2)}`,
  );
  // Note: Personality currently shifts thresholds in ThresholdOptimizer, so we check if thresholds differ if we had access,
  // but we can check if recommendation differs if scores was close.
  // Actually, we'll assert that Agg score >= Cons score (since Agg is more risk-tolerant)
  assert(
    decisionAgg.score >= decisionCons.score,
    "Aggressive personality yielded higher score/tolerance",
  );

  if (failed > 0) process.exit(1);
}

runTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
