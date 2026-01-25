"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cognitionEngine = exports.CognitionEngine = void 0;
class CognitionEngine {
    constructor() {
        /**
         * Weights to determine decision scoring
         */
        this.weights = {
            skill_sufficiency: 0.3,
            task_complexity: 0.25,
            recent_success_rate: 0.15,
            tool_benefit: 0.25,
            confidence: 0.05,
        };
    }
    /**
     * Validate that an assessment object fits the schema
     */
    validateSelfAssessment(obj) {
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
        const numericKeys = keys.slice(0, 5);
        for (const key of numericKeys) {
            const v = obj[key];
            if (typeof v !== "number" || v < 0 || v > 1)
                return false;
        }
        const validRec = ["skills", "tools", "both", "seek_guidance"];
        if (!validRec.includes(obj.recommendation))
            return false;
        return true;
    }
    /**
     * Calculate a composite decision score based on weighted factors
     */
    calculateScore(assessment) {
        return (assessment.skill_sufficiency * this.weights.skill_sufficiency + // Promotes skills
            (1 - assessment.task_complexity) * this.weights.task_complexity + // Low complexity promotes skills
            assessment.recent_success_rate * this.weights.recent_success_rate + // Success promotes skills
            (1 - assessment.tool_benefit) * this.weights.tool_benefit + // Low tool benefit promotes skills
            assessment.confidence * this.weights.confidence // Confidence promotes skills
        );
    }
    /**
     * Make a final decision on how to proceed
     */
    decide(assessment) {
        // 1. Validate
        if (!this.validateSelfAssessment(assessment)) {
            throw new Error("Invalid SelfAssessment schema");
        }
        // 2. Score (Higher score = More likely to use Skills)
        // Note: The score calculation above is oriented towards "Skill Viability"
        // High Skill Sufficiency + Low Complexity + High Success + Low Tool Benefit = High Score
        const score = this.calculateScore(assessment);
        // 3. Threshold Logic
        // > 0.75 -> Skills
        // 0.55 - 0.75 -> Hybrid
        // 0.40 - 0.55 -> Tools
        // < 0.40 -> Seek Guidance
        let action;
        let reason = "";
        if (score > 0.75) {
            action = "use_skills";
            reason = "High skill viability score detected.";
        }
        else if (score >= 0.55) {
            action = "hybrid_approach";
            reason = "Moderate complexity requires hybrid approach.";
        }
        else if (score >= 0.4) {
            action = "use_tool";
            reason = "Tool usage recommended for precision.";
        }
        else {
            action = "seek_guidance";
            reason = "Low confidence score; human guidance recommended.";
        }
        return {
            action,
            reason,
            confidence: assessment.confidence,
            score: parseFloat(score.toFixed(2)),
        };
    }
}
exports.CognitionEngine = CognitionEngine;
exports.cognitionEngine = new CognitionEngine();
