/**
 * ThresholdOptimizer — Self-calibrating decision thresholds.
 * Adjusts the 'psychological' thresholds of the cognitive engine based on real outcomes.
 */

import { Archetype } from "./cognition";
import { metaLearningService } from "../metaLearningService";
import { UNIVERSAL_TOOLS } from "../../lib/skillMapping";

export interface DecisionThresholds {
  skillConfidence: number;
  toolNecessity: number;
  guidanceRisk: number;
  hybridBalance: number;
}

export interface PersonalityBias {
  riskTolerance: number; // 0 = fully cautious, 1 = fully risk-taking
  cautiousness: number; // 0 = reckless, 1 = ultra-cautious
  experimentalism: number; // 0 = never try new tools, 1 = love experiments
}

export class ThresholdOptimizer {
  private thresholds: DecisionThresholds = {
    skillConfidence: 0.8,
    toolNecessity: 0.7,
    guidanceRisk: 0.5,
    hybridBalance: 0.6,
  };

  /**
   * Adjust thresholds based on archetype success rates, failure patterns,
   * and individual Guru personality bias.
   */
  public async adjustThresholds(metrics: any, personality?: PersonalityBias) {
    // A. Local Archetype Adjustments
    this.applyLocalAdjustments(metrics);

    // B. Global Skill-Confidence Adjustments
    const globalMatrix =
      await metaLearningService.getConfidenceMatrix(UNIVERSAL_TOOLS);
    const globalScores = Object.values(globalMatrix);

    if (globalScores.length > 0) {
      const avgGlobalConfidence =
        globalScores.reduce((a, b) => a + b, 0) / globalScores.length;

      // Calculate Personality-Driven Bias Shift
      let biasShift = 0;
      if (personality) {
        // riskTolerance pushes threshold down (lower confidence required)
        // cautiousness pushes threshold up (higher confidence required)
        biasShift =
          (personality.cautiousness - personality.riskTolerance) * 0.15;
        // Experimentalism adds a tiny random factor (0-5%)
        biasShift += Math.random() * 0.05 * (1 - personality.experimentalism);
      }

      // Blend local thresholds with global metrics and personality priors
      if (avgGlobalConfidence < 60) {
        // Platform is unstable: Raise baseline threshold
        const baselineShift = (0.9 - this.thresholds.skillConfidence) * 0.5;
        this.thresholds.skillConfidence = Math.min(
          0.95,
          Math.max(
            0.1,
            this.thresholds.skillConfidence +
              baselineShift +
              (biasShift > 0 ? biasShift : 0),
          ),
        );
      } else if (avgGlobalConfidence > 90) {
        // Platform is stellar: Lower baseline threshold if personality allows
        const baselineShift = (this.thresholds.skillConfidence - 0.7) * 0.3;
        this.thresholds.skillConfidence = Math.min(
          0.95,
          Math.max(
            0.1,
            this.thresholds.skillConfidence - baselineShift + biasShift,
          ),
        );
      }
    }
  }

  private applyLocalAdjustments(metrics: any) {
    // 1. If Skill-heavy actions are failing, we need to be MORE strict about when we use them.
    if (metrics.SKILL_HEAVY && metrics.SKILL_HEAVY.successRate < 0.7) {
      this.thresholds.skillConfidence = Math.min(
        0.95,
        this.thresholds.skillConfidence + 0.05,
      );
      console.log(
        `[Cognition] Optimizer: Raised skill-confidence threshold to ${this.thresholds.skillConfidence.toFixed(2)}`,
      );
    }

    // 2. If Tool-heavy actions are consistently successful, we can be MORE aggressive (lower necessity required).
    if (metrics.BROWSER_HEAVY && metrics.BROWSER_HEAVY.successRate > 0.9) {
      this.thresholds.toolNecessity = Math.max(
        0.4,
        this.thresholds.toolNecessity - 0.05,
      );
      console.log(
        `[Cognition] Optimizer: Lowered tool-necessity threshold to ${this.thresholds.toolNecessity.toFixed(2)}`,
      );
    }

    // 3. If "Uncertain" cases consistently require guidance but then succeed manually, maybe lower the risk?
    // Or if failures persist, raise the guidance risk.
    if (
      metrics.FAILURE_RECOVERY &&
      metrics.FAILURE_RECOVERY.successRate < 0.5
    ) {
      this.thresholds.guidanceRisk = Math.min(
        0.8,
        this.thresholds.guidanceRisk + 0.1,
      );
      console.log(
        `[Cognition] Optimizer: Raised guidance-risk threshold to ${this.thresholds.guidanceRisk.toFixed(2)}`,
      );
    }
  }

  public getThresholds(): DecisionThresholds {
    return { ...this.thresholds };
  }
}

export const thresholdOptimizer = new ThresholdOptimizer();
