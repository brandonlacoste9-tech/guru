import { z } from "zod";
import { browserBridge } from "./browserBridge";
import { sidecarClient } from "./sidecarClient";
import { sessionManager } from "./sessionManager";

/**
 * Zod schema for browser task arguments
 */
export const BrowseTheWebSchema = z.object({
  task: z
    .string()
    .describe(
      "Natural language description of what you want the browser to do",
    ),
  max_steps: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of steps the browser agent can take"),
  headless: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to run the browser in headless mode"),
});

export type BrowseTheWebArgs = z.infer<typeof BrowseTheWebSchema>;

/**
 * Tool definition for LLM tool calling (OpenAI/Anthropic format)
 */
export const browseTheWebTool = {
  type: "function" as const,
  function: {
    name: "browse_the_web",
    description:
      "Execute complex browser automation tasks using an AI agent. Use this for navigating, clicking, extracting data, or any multi-step web interaction.",
    parameters: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "Detail the mission for the browser agent.",
        },
        max_steps: {
          type: "number",
          description: "Maximum steps (default: 10).",
          default: 10,
        },
        headless: {
          type: "boolean",
          description: "Run without a visible window (default: true).",
          default: true,
        },
      },
      required: ["task"],
    },
  },
};

/**
 * Handler function for the browse_the_web tool
 * Implements graceful fallback with session persistence support:
 * 1. Try session-based execution (if guruId/runId provided)
 * 2. Fallback to browserBridge (spawns new process)
 * 3. Fallback to alternative providers
 */
export async function handleBrowseTheWeb(
  args: unknown,
  context?: { guruId?: string; runId?: string }
) {
  const parseResult = BrowseTheWebSchema.safeParse(args);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Invalid parameters: ${parseResult.error.message}`,
    };
  }

  const { task, max_steps, headless } = parseResult.data;
  const providers: ("deepseek" | "google")[] = ["deepseek", "google"];

  console.log(`🐝 [BrowserTool] Starting mission: ${task}`);

  // 1. Try session-based execution (if context provided)
  if (context?.guruId && context?.runId) {
    try {
      const sessionId = await sessionManager.getOrCreateSession(
        context.guruId,
        context.runId,
        { headless, llm_provider: "google" }
      );

      const sessionResult = await sidecarClient.executeWithSession({
        task_description: task,
        session_id: sessionId,
        headless,
        llm_provider: "google",
        run_id: context.runId,
      });

      if (sessionResult.success) {
        return {
          success: true,
          summary: `Completed in ${sessionResult.history.length} steps`,
          content: sessionResult.history.map((h) => `${h.step}. ${h.action}`).join("\n"),
          meta: {
            provider: "sidecar-session",
            steps: sessionResult.history.length,
            session_id: sessionId,
          },
        };
      }

      console.warn(
        `⚠️ Session-based execution failed: ${sessionResult.error}. Attempting fallback...`
      );
    } catch (error: any) {
      console.warn(
        `⚠️ Session execution error: ${error.message}. Attempting fallback...`
      );
    }
  }

  // 2. Try Primary (browser-use optimized via browserBridge)
  try {
    const primaryResult = await browserBridge.executeTask({
      task,
      maxSteps: max_steps,
      headless,
    });

    if (primaryResult.success) {
      return formatResult(primaryResult);
    }

    console.warn(
      `⚠️ Primary browser-use failed: ${primaryResult.error}. Attempting fallback...`,
    );
  } catch (error: any) {
    console.warn(
      `⚠️ Primary bridge error: ${error.message}. Attempting fallback...`,
    );
  }

  // 3. Fallbacks
  for (const provider of providers) {
    console.log(
      `🔄 [BrowserTool] Retrying with fallback provider: ${provider}`,
    );
    try {
      const fallbackResult = await browserBridge.executeTask({
        task,
        maxSteps: max_steps,
        headless,
        provider,
      });

      if (fallbackResult.success) {
        return formatResult(fallbackResult);
      }
      console.warn(`⚠️ Fallback ${provider} failed: ${fallbackResult.error}`);
    } catch (error: any) {
      console.error(`❌ Fallback ${provider} error: ${error.message}`);
    }
  }

  return {
    success: false,
    error:
      "All browser automation providers failed. Please try a more specific task or check logs.",
  };
}

/**
 * Helper to format the result for the AI
 */
function formatResult(result: any) {
  return {
    success: true,
    summary: result.final_result,
    content: result.extracted_content,
    meta: {
      provider: result.provider,
      steps: result.steps_taken,
      urls: result.urls_visited,
    },
  };
}
