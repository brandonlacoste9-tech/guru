import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import axios from "axios";
import { deepseekFetch } from "../lib/ai/deepseekFetch";
import {
  browseTheWebTool,
  handleBrowseTheWeb,
  BrowseTheWebSchema,
} from "../lib/ai/tools";

import * as fs from "fs";
import * as path from "path";
import { getTracer } from "../lib/tracing";
import { SpanStatusCode } from "@opentelemetry/api";

const tracer = getTracer("ai-service");

const PYTHON_SIDECAR_URL =
  process.env.PYTHON_SIDECAR_URL || "http://localhost:8001";

// Providers are initialized lazily inside the service
export class AIService {
  private _deepseek: any;
  private _google: any;

  private get deepseek() {
    if (!this._deepseek) {
      this._deepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com",
        fetch: deepseekFetch,
        compatibility: "strict",
      } as any);
    }
    return this._deepseek;
  }

  private get google() {
    if (!this._google) {
      this._google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });
    }
    return this._google;
  }
  /**
   * Evaluate a task using the Antigravity Cognitive Engine prompts
   */
  async getSelfAssessment(params: { taskDescription: string; guru: any }) {
    const { fillPrompt, CognitivePrompts } =
      await import("./antigravity/cognition");

    const prompt = fillPrompt(CognitivePrompts.selfAssessment, {
      TASK_DESCRIPTION: params.taskDescription,
      GURU_CATEGORY: params.guru.category,
      GURU_PERSONALITY: params.guru.personality,
    });

    const span = tracer.startSpan(`getSelfAssessment: ${params.guru.name}`, {
      attributes: {
        "guru.id": params.guru.id,
        "guru.category": params.guru.category,
      },
    });

    try {
      const result = await generateText({
        model: this.google.chat("gemini-1.5-flash-latest"), // Faster/Cheaper for metadata extraction
        prompt,
      });

      const json = JSON.parse(result.text.trim());

      // Map 1-10 to 0-1
      return {
        skill_sufficiency: (json.skill_sufficiency || 5) / 10,
        task_complexity: (json.task_complexity || 5) / 10,
        recent_success_rate: (json.recent_success_rate || 5) / 10,
        tool_benefit: (json.tool_benefit || 5) / 10,
        confidence: (json.confidence || 5) / 10,
        recommendation: (json.recommendation || "both") as any,
      };
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      console.error("❌ Failed to get self-assessment:", error.message);

      // Return safe defaults
      return {
        skill_sufficiency: 0.5,
        task_complexity: 0.5,
        recent_success_rate: 0.5,
        tool_benefit: 0.5,
        confidence: 0.5,
        recommendation: "both" as any,
      };
    } finally {
      span.end();
    }
  }

  /**
   * Primary execution method using DeepSeek with Gemini fallback
   */
  async executeReasoning(params: {
    systemPrompt: string;
    userPrompt: string;
    guruId?: string;
    maxSteps?: number;
    tools?: string[];
    meta?: {
      globalConfidence?: number;
      personality?: any;
      runId?: string;
    };
  }) {
    console.log(`🤖 Guru ${params.guruId || "Unknown"} is reasoning...`);

    const span = tracer.startSpan(
      `executeReasoning: ${params.guruId || "unknown"}`,
      {
        attributes: {
          "guru.id": params.guruId,
          maxSteps: params.maxSteps || 30,
          "meta.global_confidence": params.meta?.globalConfidence,
          "meta.personality": JSON.stringify(params.meta?.personality || {}),
        },
      },
    );

    try {
      const result = await generateText({
        model: this.deepseek.chat("deepseek-chat"),
        system: params.systemPrompt,
        prompt: params.userPrompt,
        tools: {
          ...this.getBrowserTools(params.guruId, params.meta?.runId),
          ...this.getMemoryTools(params.guruId),
          ...this.getExpertTools(params.tools || []),
        } as any,
      });

      return {
        success: true,
        text: result.text,
        toolCalls: result.toolCalls,
        usage: result.usage,
        provider: "deepseek",
      };
    } catch (error: any) {
      span.setAttribute("provider.deepseek.failed", true);
      span.recordException(error);
      console.warn(
        `⚠️ DeepSeek failed! [${params.guruId || "Unknown"}]`,
        error.message,
      );
      if (error.response?.data) {
        console.warn(
          "DeepSeek error response:",
          JSON.stringify(error.response.data),
        );
        // Log detailed error to file for analysis
        fs.appendFileSync(
          "ai_error.log",
          `[${new Date().toISOString()}] DeepSeek Error Response: ${JSON.stringify(error.response.data)}\n`,
        );
      } else {
        fs.appendFileSync(
          "ai_error.log",
          `[${new Date().toISOString()}] DeepSeek Error: ${error.message}\n${error.stack}\n`,
        );
        console.log("Full error logged to ai_error.log");
      }

      try {
        const fallbackResult = await generateText({
          model: this.google.chat("gemini-1.5-flash-latest"),
          system: params.systemPrompt,
          prompt: params.userPrompt,
          tools: {
            ...this.getBrowserTools(params.guruId, params.meta?.runId),
            ...this.getMemoryTools(params.guruId),
            ...this.getExpertTools(params.tools || []),
          } as any,
        });

        return {
          success: true,
          text: fallbackResult.text,
          toolCalls: fallbackResult.toolCalls,
          usage: fallbackResult.usage,
          provider: "google",
        };
      } catch (fallbackError: any) {
        console.error("💀 All LLM providers failed.", fallbackError.message);
        throw new Error(`AI Execution failed: ${fallbackError.message}`);
      }
    } finally {
      span.end();
    }
  }

  /**
   * Browser automation tools powered by browser-use
   */
  private getBrowserTools(guruId?: string, runId?: string): any {
    return {
      browse_the_web: tool({
        description: browseTheWebTool.function.description,
        parameters: BrowseTheWebSchema,
        execute: async (args: any) =>
          handleBrowseTheWeb(args, { guruId, runId }),
      } as any),
    };
  }

  /**
   * Memory management tools for persistent knowledge
   */
  private getMemoryTools(guruId?: string): any {
    if (!guruId) return {};

    const memoryDir = path.join(process.cwd(), "memory", `guru-${guruId}`);

    return {
      save_finding: tool({
        description: "Save a key finding or piece of data to permanent memory.",
        parameters: z.object({
          finding: z
            .string()
            .describe("The finding to save (markdown supported)"),
          category: z
            .string()
            .optional()
            .describe(
              "Category like 'credentials', 'selectors', 'observations'",
            ),
        }),
        execute: async ({
          finding,
          category,
        }: {
          finding: string;
          category?: string;
        }) => {
          const findingsPath = path.join(memoryDir, "findings.md");
          const entry = `\n### ${category || "Observation"} - ${new Date().toISOString()}\n${finding}\n`;
          fs.appendFileSync(findingsPath, entry);
          return { success: true, message: "Finding saved to memory." };
        },
      } as any),
      update_task_plan: tool({
        description: "Update the current task plan or roadmap for this Guru.",
        parameters: z.object({
          updatedPlan: z
            .string()
            .describe("The complete updated plan in markdown"),
        }),
        execute: async (args: { updatedPlan: string }) => {
          const { updatedPlan } = args;
          const planPath = path.join(memoryDir, "task_plan.md");
          fs.writeFileSync(planPath, updatedPlan);
          return { success: true, message: "Task plan updated." };
        },
      } as any),
    };
  }

  /**
   * Generates dynamic tools for expert skills.
   * This bridges the 222+ skills into the LLM context.
   */
  private getExpertTools(allowedSkills: string[]): any {
    if (allowedSkills.length === 0) return {};

    const tools: any = {};

    // 1. Tool to lookup skill details
    tools.lookup_expert_skill = tool({
      description:
        "Lookup detailed instructions and examples for a specialized expert skill.",
      parameters: z.object({
        skillName: z.string().describe("The name of the skill to lookup"),
      }),
      execute: async ({ skillName }: { skillName: string }) => {
        if (!allowedSkills.includes(skillName)) {
          return {
            error: `Permission denied: Skill '${skillName}' is not in your domain-specific toolset.`,
          };
        }

        const skillPaths = [
          path.join(process.cwd(), ".agent", "skills", skillName, "SKILL.md"),
          path.join(
            process.cwd(),
            ".agent",
            "external-skills",
            "antigravity-awesome-skills",
            "skills",
            skillName,
            "SKILL.md",
          ),
        ];

        for (const skillPath of skillPaths) {
          if (fs.existsSync(skillPath)) {
            const content = fs.readFileSync(skillPath, "utf-8");
            return {
              success: true,
              skill: skillName,
              instructions: content,
            };
          }
        }
        return { error: `Skill '${skillName}' definition not found.` };
      },
    } as any);

    // 2. Tool to execute skill-specific scripts (if any)
    tools.execute_skill_script = tool({
      description:
        "Execute a helper script associated with a specialized skill.",
      parameters: z.object({
        skillName: z.string().describe("The name of the skill"),
        scriptName: z
          .string()
          .describe("The filename of the script (e.g. 'audit.py')"),
        args: z
          .array(z.string())
          .optional()
          .describe("Arguments to pass to the script"),
      }),
      execute: async (args: { skillName: string; scriptName: string; args?: string[] }) => {
        const { skillName, scriptName, args: scriptArgs = [] } = args;
        if (!allowedSkills.includes(skillName)) {
          return {
            error: `Permission denied: Skill '${skillName}' is not in your domain-specific toolset.`,
          };
        }

        // This is a bridge to the local file system / terminal
        // For security, we'll limit to specific scripts if needed, but for now we follow the 'maestro' protocol
        console.log(
          `🚀 [SkillTool] Running script ${scriptName} for skill ${skillName}`,
        );

        // Return a placeholder indicating where to find it or how to run it
        // In a real execution environment, we'd use run_command or equivalent
        return {
          success: true,
          message: `Script ${scriptName} for ${skillName} is ready for orchestration.`,
          how_to_run: `python .agent/skills/${skillName}/scripts/${scriptName} ${scriptArgs.join(" ")}`,
        };
      },
    } as any);

    return tools;
  }
}

export const aiService = new AIService();
