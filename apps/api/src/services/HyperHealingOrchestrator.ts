import {
  db,
  automationSolutions,
  healingEvents,
  eq,
  and,
  desc,
  gt,
  sql,
} from "@guru/database";
import crypto from "crypto";
import { aiService } from "./aiService";

export interface HealingContext {
  error: Error;
  step: any;
  // Using a simplified browser context representation for now
  browserContext: {
    browserType: string;
    userAgent: string;
    url?: string;
  };
  userProfileId?: string;
  domain: string;
  missionRunId: string;
  guruId: string;
}

export interface ErrorFingerprint {
  signature: string;
  context: {
    browserType: string;
    domain: string;
    userAgent: string;
    timeOfDay: string;
    userProfileId?: string;
  };
}

export class HyperHealingOrchestrator {
  /**
   * Generate a unique fingerprint for an error based on context
   */
  async generateErrorFingerprint(
    context: HealingContext,
  ): Promise<ErrorFingerprint> {
    const fingerprintData = {
      errorMessage: context.error.message,
      // Taking first 500 chars of stack to avoid excessive noise
      errorStack: context.error.stack?.substring(0, 500) || "",
      domain: context.domain,
      browserType: context.browserContext.browserType || "chromium",
      userAgent: context.browserContext.userAgent || "unknown",
      timeOfDay: new Date().getHours(), // Simple time-of-day broad bucket
      // We explicitly DON'T include dynamic IDs in the hash to ensure recurrence matching
    };

    const signature = crypto
      .createHash("sha256")
      .update(JSON.stringify(fingerprintData))
      .digest("hex")
      .substring(0, 32);

    return {
      signature,
      context: {
        browserType: fingerprintData.browserType,
        domain: fingerprintData.domain,
        userAgent: fingerprintData.userAgent,
        timeOfDay: fingerprintData.timeOfDay.toString(),
        userProfileId: context.userProfileId,
      },
    };
  }

  /**
   * Consult the healing matrix for previously successful solutions
   */
  async consultHealingMatrix(fingerprint: ErrorFingerprint): Promise<any[]> {
    // 1. Precise Match: Same error signature + High Confidence
    const preciseMatches = await db
      .select()
      .from(automationSolutions)
      .where(
        and(
          eq(automationSolutions.errorSignature, fingerprint.signature),
          gt(automationSolutions.confidenceScore, 70), // Only high confidence
        ),
      )
      .orderBy(desc(automationSolutions.confidenceScore))
      .limit(5);

    if (preciseMatches.length > 0) {
      return preciseMatches;
    }

    // 2. Contextual Fallback: If we had JSON path matching in Drizzle/PG utils easily available we'd filter by domain
    // For now, we rely on signature accuracy.
    // Future: implement loose matching if signature is too strict.

    return [];
  }

  /**
   * Synthesize the best fix from candidate solutions
   */
  async synthesizeFix(
    candidates: any[],
    context: HealingContext,
  ): Promise<{ solution: any; confidence: number; id: string } | null> {
    if (candidates.length === 0) return null;

    // Weight by confidence and success rate
    const weightedCandidates = candidates.map((solution) => ({
      ...solution,
      weightedScore:
        solution.confidenceScore *
        (solution.successCount / (solution.totalCount || 1)),
    }));

    // Sort by weighted score
    weightedCandidates.sort((a, b) => b.weightedScore - a.weightedScore);

    const bestCandidate = weightedCandidates[0];

    // Assuming validation passes (e.g. checkSelector logic would go here)
    // For this MVP, we trust high-confidence matrix solutions.

    return {
      solution: bestCandidate.solution,
      confidence: bestCandidate.confidenceScore,
      id: bestCandidate.id,
    };
  }

  /**
   * Main orchestration method - decides how to heal
   */
  async orchestrateHealing(
    context: HealingContext,
  ): Promise<{
    strategy: string;
    solution: any;
    confidence: number;
    fingerprint: string;
  }> {
    // Step 1: Generate error fingerprint
    const fingerprint = await this.generateErrorFingerprint(context);

    // Step 2: Consult healing matrix
    const matrixSolutions = await this.consultHealingMatrix(fingerprint);

    // Step 3: Try matrix solutions first
    if (matrixSolutions.length > 0) {
      const synthesized = await this.synthesizeFix(matrixSolutions, context);
      if (synthesized) {
        // Boost used stats for this solution (optimistic usage logging could go here, but we do it in recordHealingEvent)
        return {
          strategy: "MATRIX_BASED",
          solution: synthesized.solution,
          confidence: synthesized.confidence,
          fingerprint: fingerprint.signature,
        };
      }
    }

    // Step 4: Fall back to AI analysis
    const aiSolution = await this.generateAISolution(context);

    // Step 5: Record the new solution for future use
    if (aiSolution) {
      await this.recordNewSolution(fingerprint, aiSolution, context);
    }

    return {
      strategy: "AI_GENERATED",
      solution: aiSolution,
      confidence: aiSolution ? 85 : 0, // AI is smart but matrix is proven
      fingerprint: fingerprint.signature,
    };
  }

  /**
   * Generate solution using AI when no matrix solution exists
   */
  private async generateAISolution(context: HealingContext): Promise<any> {
    const prompt = `
ERROR ANALYSIS CONTEXT:
- Error Message: ${context.error.message}
- Domain: ${context.domain}
- Current Step: ${JSON.stringify(context.step)}
- Browser: ${context.browserContext.browserType}

The automation failed. Propose a JSON fix.
Supported Fix Types:
1. "SELECTOR_FIX": Provide { "newSelector": "..." }
2. "WAIT_STRATEGY": Provide { "additionalWaitMs": 2000 }
3. "TOOL_RETRY": Provide { "retryParams": { ... } }

Return ONLY valid JSON:
{
  "type": "SELECTOR_FIX",
  "payload": { ... },
  "description": "Brief reasoning"
}`;

    try {
      const response = await aiService.executeReasoning({
        systemPrompt:
          "You are the HyperHealing Sentinel. Analyze errors and produce precise JSON fixes.",
        userPrompt: prompt,
        maxSteps: 1, // We just want one shot generation
      });

      // Attempt to parse JSON from the text
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate minimal schema
        if (parsed.type && parsed.payload) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error("AI healing generation failed:", error);
      return null;
    }
  }

  /**
   * Record a new AI-generated solution in the matrix
   */
  private async recordNewSolution(
    fingerprint: ErrorFingerprint,
    solution: any,
    context: HealingContext,
  ): Promise<void> {
    await db.insert(automationSolutions).values({
      errorSignature: fingerprint.signature,
      solutionType: solution.type,
      solution: solution, // stores the full object including payload/desc
      contextTags: fingerprint.context,
      confidenceScore: 80, // Start high but tentative
      successCount: 0,
      totalCount: 0,
      createdByGuruId: context.guruId,
    });
  }

  /**
   * Record a healing attempt and update confidence scores
   */
  async recordHealingEvent(
    missionRunId: string,
    errorSignature: string,
    attemptedFix: any,
    outcome: "SUCCESS" | "FAILED" | "PARTIAL",
    processingTime: number,
  ): Promise<void> {
    // 1. Log Event
    await db.insert(healingEvents).values({
      missionRunId,
      errorSignature,
      attemptedFix: attemptedFix,
      fixType: attemptedFix.type || "UNKNOWN",
      outcome,
      processingTime,
      // confidenceUsed is optional, leaving null for now or could pass it in
    });

    // 2. Update Learning Matrix
    if (outcome === "SUCCESS") {
      await db.execute(sql`
        UPDATE automation_solutions 
        SET 
          success_count = success_count + 1,
          total_count = total_count + 1,
          confidence_score = LEAST(confidence_score + 5, 100),
          last_used_at = NOW()
        WHERE error_signature = ${errorSignature}
      `);
    } else {
      await db.execute(sql`
        UPDATE automation_solutions 
        SET 
          total_count = total_count + 1,
          confidence_score = GREATEST(confidence_score - 10, 0),
          last_used_at = NOW()
        WHERE error_signature = ${errorSignature}
      `);
    }
  }
}

export const hyperHealingOrchestrator = new HyperHealingOrchestrator();
