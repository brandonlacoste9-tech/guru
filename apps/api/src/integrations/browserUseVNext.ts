import { trace, Span, SpanStatusCode } from "@opentelemetry/api";
import { spawn } from "child_process";
import path from "path";
import { z } from "zod";

// ---------------------------------------------------
// Public interface – matches the user's suggested vNext blueprint
// ---------------------------------------------------
export interface VNextOpts {
  task?: string; // Standard task description
  url: string; // Start URL
  actions: Array<
    | { type: "goto"; url: string }
    | { type: "click"; selector: string }
    | { type: "type"; selector: string; text: string }
    | { type: "wait"; secs: number }
    | { type: "screenshot" }
  >;
  /** Optional Pydantic / Zod schema for structured output */
  outputSchema?: z.ZodType<any>;
  /** Enable stealth (78 Chrome flags) */
  stealth?: boolean;
  /** Run the whole mission in a sandbox (isolated cookies) */
  sandbox?: boolean;
  /** Record an MP4 of the whole run */
  recordVideo?: boolean;
  /** Provider override */
  provider?: string;
}

/**
 * BrowserUseVNext Bridge
 * Implements the user's conceptual DX while orchestrating the upgraded Python engine.
 */
export class BrowserUseVNext {
  private tracer = trace.getTracer("browser-use-vnext");
  private pythonPath: string;
  private scriptPath: string;

  constructor(private readonly opts: VNextOpts) {
    this.pythonPath = process.env.PYTHON_PATH || "python";
    this.scriptPath = path.join(__dirname, "../../antigravity_browser.py");
  }

  /**
   * Public entry point – returns either raw data or a parsed schema
   */
  public async run(): Promise<any> {
    const span = this.tracer.startSpan("guru.browser.run", {
      attributes: {
        "meta.browser_version": "vNext-2026-02",
        "meta.stealth_enabled": !!this.opts.stealth,
        "meta.sandboxed": !!this.opts.sandbox,
        "meta.video_recorded": !!this.opts.recordVideo,
        "meta.url": this.opts.url,
      },
    });

    try {
      // Feature Flag Check
      const useVNext = process.env.BROWSER_USE_VNEXT !== "false";

      if (!useVNext) {
        span.addEvent("fallback_to_legacy");
        span.setAttribute("meta.browser_fallback", true);
        // In a real implementation, call legacy driver here
      }

      const result = await this.executePythonTask(span);

      if (this.opts.outputSchema && result.success) {
        try {
          const validatedData = this.opts.outputSchema.parse(result.data);
          span.setAttribute("meta.validation_success", true);
          return validatedData;
        } catch (validationError: any) {
          span.setAttribute("meta.validation_success", false);
          span.recordException(validationError);
          console.warn(
            "⚠️ Schema validation failed, returning raw data",
            validationError.message,
          );
        }
      }

      span.setStatus({ code: SpanStatusCode.OK });
      return result.data;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  }

  private async executePythonTask(span: Span): Promise<any> {
    return new Promise((resolve, reject) => {
      // Build task from actions
      const taskDescription =
        this.opts.task ||
        `Go to ${this.opts.url} and perform the following actions: ${JSON.stringify(this.opts.actions)}`;

      const args = [
        this.scriptPath,
        taskDescription,
        "--max-steps",
        "30",
        "--headless",
        "true",
      ];

      if (this.opts.stealth) args.push("--enable-stealth");
      if (this.opts.sandbox) args.push("--sandbox");
      if (this.opts.recordVideo) args.push("--record-video");
      if (this.opts.provider) args.push("--provider", this.opts.provider);

      const python = spawn(this.pythonPath, args, {
        env: { ...process.env, BROWSER_USE_VNEXT: "true" },
      });

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => (stdout += data.toString()));
      python.stderr.on("data", (data) => (stderr += data.toString()));

      python.on("close", (code) => {
        if (code === 0) {
          try {
            const lines = stdout.trim().split("\n");
            let parsed = null;

            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const p = JSON.parse(lines[i]);
                if (p && typeof p === "object" && "success" in p) {
                  parsed = p;
                  break;
                }
              } catch (e) {}
            }

            if (!parsed) throw new Error("No JSON result found in output");

            if (parsed.video_path) {
              span.setAttribute("meta.video_path", parsed.video_path);
            }

            resolve({
              success: parsed.success,
              data: parsed.final_result || parsed.extracted_content || parsed,
              videoPath: parsed.video_path,
            });
          } catch (e) {
            reject(new Error("Failed to parse Python output: " + stdout));
          }
        } else {
          reject(
            new Error(
              `Python process exited with code ${code}. Stderr: ${stderr}`,
            ),
          );
        }
      });
    });
  }
}
