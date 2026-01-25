"use strict";
// src/antigravity/cognition.ts
// Antigravity Cognitive Engine — unified, drop-in module for FloGuru
Object.defineProperty(exports, "__esModule", { value: true });
exports.cognitiveEngine = exports.AntigravityCognitiveEngine = exports.seedExamples = void 0;
exports.validateSelfAssessment = validateSelfAssessment;
exports.inferArchetype = inferArchetype;
exports.computeScore = computeScore;
exports.updateStats = updateStats;
exports.adjustRecommendationForArchetype = adjustRecommendationForArchetype;
exports.synthesizeExample = synthesizeExample;
exports.buildSyntheticTrainingSet = buildSyntheticTrainingSet;
// ---------- Utils ----------
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}
// ---------- Validation ----------
function validateSelfAssessment(obj) {
    const keys = [
        "skill_sufficiency",
        "task_complexity",
        "recent_success_rate",
        "tool_benefit",
        "confidence",
        "recommendation",
    ];
    for (const key of keys) {
        if (!(key in obj))
            return false;
    }
    for (const key of keys.slice(0, 5)) {
        const v = obj[key];
        if (typeof v !== "number" || v < 0 || v > 1)
            return false;
    }
    const validRec = [
        "skills",
        "tools",
        "both",
        "seek_guidance",
    ];
    if (!validRec.includes(obj.recommendation))
        return false;
    return true;
}
// ---------- Archetype Inference (Clustering) ----------
function inferArchetype(a) {
    if (a.confidence < 0.4 && a.task_complexity > 0.75)
        return "UNCERTAIN";
    if (a.recent_success_rate < 0.5 && a.task_complexity > 0.7)
        return "FAILURE_RECOVERY";
    if (a.tool_benefit > 0.75 && a.task_complexity > 0.7)
        return "BROWSER_HEAVY";
    if (a.skill_sufficiency > 0.8 && a.task_complexity < 0.5)
        return "ROUTINE";
    if (a.skill_sufficiency > 0.75 && a.tool_benefit < 0.5)
        return "SKILL_HEAVY";
    if (a.skill_sufficiency > 0.6 && a.tool_benefit > 0.6)
        return "HYBRID";
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
function computeScore(a) {
    return (a.skill_sufficiency * WEIGHTS.skill_sufficiency +
        (1 - a.task_complexity) * WEIGHTS.task_complexity +
        a.recent_success_rate * WEIGHTS.recent_success_rate +
        (1 - a.tool_benefit) * WEIGHTS.tool_benefit +
        a.confidence * WEIGHTS.confidence);
}
const archetypeStats = {
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
function updateStats(archetype, outcome) {
    const s = archetypeStats[archetype];
    s.count += 1;
    const alpha = 0.1;
    s.successRate =
        (1 - alpha) * s.successRate + alpha * (outcome.success ? 1 : 0);
    s.avgDuration = (1 - alpha) * s.avgDuration + alpha * outcome.durationMs;
    if (outcome.success) {
        s.consecutiveFailures = 0;
    }
    else {
        s.consecutiveFailures += 1;
    }
}
function adjustRecommendationForArchetype(archetype, baseRec, durationVariance = 0) {
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
const lastHistory = [];
const MEMORY_LIMIT = 10;
function pushWithLimit(arr, value) {
    arr.push(value);
    if (arr.length > MEMORY_LIMIT)
        arr.shift();
}
// ---------- Seed Examples ----------
exports.seedExamples = [
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
function synthesizeExample(base, i) {
    const jitter = () => (Math.random() - 0.5) * 0.1; // ~±0.05
    const a = base.assessment;
    const newAssessment = {
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
function buildSyntheticTrainingSet(seeds, perSeed) {
    const out = [];
    for (const seed of seeds) {
        out.push(seed);
        for (let i = 0; i < perSeed; i++) {
            out.push(synthesizeExample(seed, i));
        }
    }
    return out;
}
// ---------- Unified Cognitive Loop ----------
class AntigravityCognitiveEngine {
    constructor() {
        this.version = "1.0-unified";
    }
    getArchetypeStats() {
        return archetypeStats;
    }
    getRecentHistory() {
        return lastHistory;
    }
    // --- Decision Logic ---
    enforceBehaviors(assessment, baseRec) {
        if (assessment.confidence < 0.4)
            return "seek_guidance";
        if (assessment.task_complexity > 0.8 && assessment.tool_benefit > 0.5)
            return "tools";
        if (assessment.task_complexity < 0.4 && assessment.skill_sufficiency > 0.5)
            return "skills";
        if (assessment.skill_sufficiency > 0.6 && assessment.tool_benefit > 0.6)
            return "both";
        return baseRec;
    }
    // Main entry point
    async decideForTask(task, assessment, durationVariance = 0) {
        const taskId = task.id || generateId();
        const safeAssessment = {
            ...assessment,
            skill_sufficiency: clamp01(assessment.skill_sufficiency),
            task_complexity: clamp01(assessment.task_complexity),
            recent_success_rate: clamp01(assessment.recent_success_rate),
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
        let rec = "seek_guidance";
        if (score >= 0.75)
            rec = "skills";
        else if (score >= 0.55)
            rec = "both";
        else if (score >= 0.4)
            rec = "tools";
        else
            rec = "seek_guidance";
        // 3. Enforce Cognitive Behaviors
        rec = this.enforceBehaviors(safeAssessment, rec);
        // 4. Pattern Refinement (RL)
        const refinement = adjustRecommendationForArchetype(archetype, rec, durationVariance);
        const finalRec = refinement.rec;
        const decision = {
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
    recordOutcome(taskId, outcome) {
        // Find task in history
        const entry = lastHistory.find((h) => h.taskId === taskId);
        if (!entry) {
            // Fallback if ID not found (e.g. strict memory limit), just ignore or log
            // For stats, we strictly need archetype. If we don't have it, we can't update correctly.
            // In a real DB we'd fetch it. Here we skip.
            console.warn(`[Cognition] recordOutcome: Task ${taskId} not found in STM. Stats not updated.`);
            return;
        }
        entry.outcome = outcome;
        updateStats(entry.archetype, outcome);
    }
}
exports.AntigravityCognitiveEngine = AntigravityCognitiveEngine;
exports.cognitiveEngine = new AntigravityCognitiveEngine();
