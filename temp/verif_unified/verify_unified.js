"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cognition_1 = require("./cognition");
console.log("🚀 Starting Antigravity Engine (Unified) Verification...");
let passed = 0;
let failed = 0;
function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    }
    else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}
async function runTest() {
    // 1. STM & History
    const task1 = {
        skill_sufficiency: 0.9,
        task_complexity: 0.2,
        recent_success_rate: 0.9,
        tool_benefit: 0.1,
        confidence: 0.9,
        recommendation: "skills",
    };
    // Test Decide
    const context = { id: "test-1", description: "Testing STM" };
    const decision1 = await cognition_1.cognitiveEngine.decideForTask(context, task1);
    // Test Outcome
    cognition_1.cognitiveEngine.recordOutcome("test-1", { success: true, durationMs: 500 });
    const history = cognition_1.cognitiveEngine.getRecentHistory();
    console.log(`   History count: ${history.length}`);
    assert(history.length > 0, "History captured");
    assert(history[0].decision.recommendation === "skills", "Decision recorded");
    assert(history[0].outcome?.success === true, "Outcome recorded");
    // 2. Behavior: Self-Doubt
    const doubtTask = {
        skill_sufficiency: 0.5,
        task_complexity: 0.5,
        recent_success_rate: 0.5,
        tool_benefit: 0.5,
        confidence: 0.3,
        recommendation: "both", // should become seek_guidance
    };
    const decision2 = await cognition_1.cognitiveEngine.decideForTask({ id: "doubt-1", description: "Doubt" }, doubtTask);
    console.log(`   Doubt Action: ${decision2.recommendation}`);
    assert(decision2.recommendation === "seek_guidance", "Self-doubt behavior triggered");
    // 3. Pattern Refinement: Consecutive Failures
    // FAILURE_RECOVERY archetype
    const failTask = {
        skill_sufficiency: 0.5,
        task_complexity: 0.9,
        recent_success_rate: 0.2, // Maps to FAILURE_RECOVERY
        tool_benefit: 0.8,
        confidence: 0.5,
        recommendation: "tools",
    };
    console.log("   Simulating 3 failures...");
    // 1
    await cognition_1.cognitiveEngine.decideForTask({ id: "f-1", description: "F1" }, failTask);
    cognition_1.cognitiveEngine.recordOutcome("f-1", { success: false, durationMs: 1000 });
    // 2
    await cognition_1.cognitiveEngine.decideForTask({ id: "f-2", description: "F2" }, failTask);
    cognition_1.cognitiveEngine.recordOutcome("f-2", { success: false, durationMs: 1000 });
    // 3
    await cognition_1.cognitiveEngine.decideForTask({ id: "f-3", description: "F3" }, failTask);
    cognition_1.cognitiveEngine.recordOutcome("f-3", { success: false, durationMs: 1000 });
    // 4th attempt should be blocked
    const decisionFail = await cognition_1.cognitiveEngine.decideForTask({ id: "f-4", description: "F4" }, failTask);
    console.log(`   Lockout Action: ${decisionFail.recommendation}`);
    console.log(`   Reason: ${decisionFail.reason}`);
    assert(decisionFail.recommendation === "seek_guidance", "RL Lockout triggered");
    assert(decisionFail.reason.includes("Consecutive Failures"), "Reason cites consecutive failures");
    // 4. Pattern Refinement: Duration Spike
    // ROUTINE archetype (usually fast)
    const routineTask = {
        skill_sufficiency: 0.9,
        task_complexity: 0.2,
        recent_success_rate: 0.9,
        tool_benefit: 0.2,
        confidence: 0.9,
        recommendation: "skills",
    };
    console.log("\n   Simulating Duration Spike...");
    // Duration variance 0.3 (30%)
    const decisionSlow = await cognition_1.cognitiveEngine.decideForTask({ id: "slow-1", description: "Slow" }, routineTask, 0.3);
    console.log(`   Slow Action: ${decisionSlow.recommendation}`);
    console.log(`   Reason: ${decisionSlow.reason}`);
    // Skills -> Both (Rule 2)
    assert(decisionSlow.recommendation === "both", "Duration spike downgraded Skills -> Both");
    assert(decisionSlow.reason.includes("Duration Spike"), "Reason cites Duration Spike");
    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    if (failed > 0)
        process.exit(1);
}
runTest().catch((e) => {
    console.error(e);
    process.exit(1);
});
