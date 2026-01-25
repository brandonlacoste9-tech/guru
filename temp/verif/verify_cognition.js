"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CognitionEngine_1 = require("./CognitionEngine");
console.log("🚀 Starting Cognition Engine Verification...");
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
// Test 1: Validation
const valid = {
    skill_sufficiency: 0.8,
    task_complexity: 0.2,
    recent_success_rate: 0.9,
    tool_benefit: 0.1,
    confidence: 0.9,
    recommendation: "skills",
};
assert(CognitionEngine_1.cognitionEngine.validateSelfAssessment(valid) === true, "Valid assessment validation");
const invalid = { skill_sufficiency: 1.5 }; // Invalid
assert(CognitionEngine_1.cognitionEngine.validateSelfAssessment(invalid) === false, "Invalid assessment validation");
// Test 2: High Skill Score -> Skills
const highSkill = {
    skill_sufficiency: 0.95,
    task_complexity: 0.1,
    recent_success_rate: 0.95,
    tool_benefit: 0.1,
    confidence: 0.9,
    recommendation: "skills",
};
const decisionSkill = CognitionEngine_1.cognitionEngine.decide(highSkill);
console.log(`   Score for High Skill: ${decisionSkill.score}`);
assert(decisionSkill.action === "use_skills", "Recommendation: use_skills");
assert(decisionSkill.score > 0.75, "Score > 0.75");
// Test 3: Low Skill -> Tools
const lowSkill = {
    skill_sufficiency: 0.3,
    task_complexity: 0.9,
    recent_success_rate: 0.4,
    tool_benefit: 0.9,
    confidence: 0.5,
    recommendation: "tools",
};
const decisionTool = CognitionEngine_1.cognitionEngine.decide(lowSkill);
console.log(`   Score for Low Skill: ${decisionTool.score}`);
assert(decisionTool.action === "use_tool", "Recommendation: use_tool");
assert(decisionTool.score >= 0.4 && decisionTool.score < 0.55, "Score between 0.40 and 0.55");
// Test 4: Critical Failure -> Seek Guidance
const criticalFail = {
    skill_sufficiency: 0.1,
    task_complexity: 0.95,
    recent_success_rate: 0.1,
    tool_benefit: 0.5,
    confidence: 0.2,
    recommendation: "seek_guidance",
};
const decisionGuidance = CognitionEngine_1.cognitionEngine.decide(criticalFail);
console.log(`   Score for Critical Fail: ${decisionGuidance.score}`);
assert(decisionGuidance.action === "seek_guidance", "Recommendation: seek_guidance");
assert(decisionGuidance.score < 0.4, "Score < 0.40");
console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
if (failed > 0)
    process.exit(1);
