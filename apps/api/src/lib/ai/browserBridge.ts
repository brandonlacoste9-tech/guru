import { spawn } from "child_process";
import path from "path";

export interface BrowserTaskOptions {
  task: string;
  provider?: "browser-use" | "deepseek" | "google";
  maxSteps?: number;
  headless?: boolean;
  saveScreenshots?: boolean;
  screenshotInterval?: "final" | "step";
  profileName?: string;
  runId?: string;
}

export interface BrowserTaskResult {
  success: boolean;
  task: string;
  provider: string;
  run_id: string;
  steps_taken?: number;
  urls_visited?: string[];
  final_result?: any;
  extracted_content?: any[];
  screenshots?: string[];
  errors?: string[];
  error?: string;
  error_type?: string;
  traceback?: string;
}

export class BrowserBridge {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    // Path to Python script
    this.pythonPath = process.env.PYTHON_PATH || "python";
    this.scriptPath = path.join(__dirname, "../../../antigravity_browser.py");
  }

  async executeTask(options: BrowserTaskOptions): Promise<BrowserTaskResult> {
    const {
      task,
      maxSteps = 10,
      headless = true,
      provider,
      saveScreenshots,
      screenshotInterval,
      profileName,
      runId,
    } = options;

    return new Promise((resolve, reject) => {
      const args = [
        this.scriptPath,
        task,
        "--max-steps",
        String(maxSteps),
        "--headless",
        String(headless),
      ];

      if (provider) {
        args.push("--provider", provider);
      }

      if (saveScreenshots) {
        args.push("--save-screenshots");
      }

      if (screenshotInterval) {
        args.push("--screenshot-interval", screenshotInterval);
      }

      if (profileName) {
        args.push("--profile-name", profileName);
      }

      if (runId) {
        args.push("--run-id", runId);
      }

      const timeoutMs = Number(process.env.BRIDGE_TIMEOUT_MS) || 120000;
      console.log(
        `🐝 Spawning Antigravity Browser with provider=${provider || "browser-use"} (timeout: ${timeoutMs}ms)`,
      );

      const python = spawn(this.pythonPath, args, {
        env: {
          ...process.env,
          BROWSER_USE_API_KEY: process.env.BROWSER_USE_API_KEY,
        },
      });

      const timeout = setTimeout(() => {
        python.kill("SIGTERM");
        reject(
          new Error(`Browser bridge execution timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
        process.stderr.write(data); // Verbose logs enabled
      });

      python.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          try {
            const lines = stdout.trim().split("\n");
            let result: BrowserTaskResult | null = null;

            // Search from bottom for JSON result (skipping any prints)
            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const parsed = JSON.parse(lines[i]);
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  "success" in parsed
                ) {
                  result = parsed as BrowserTaskResult;
                  break;
                }
              } catch (e) {
                continue;
              }
            }

            if (!result) {
              throw new Error(
                "No JSON result found in stdout. Process output: " + stdout,
              );
            }

            if (result.success) {
              console.log(
                `✅ Browser task SUCCESS in ${result.steps_taken} steps using ${result.provider}`,
              );
            } else {
              console.error(`❌ Browser task FAILED: ${result.error}`);
            }

            resolve(result);
          } catch (parseError) {
            reject(
              new Error(
                `Failed to parse browser output: ${parseError}\nFull Output: ${stdout}`,
              ),
            );
          }
        } else {
          // Check if it's a known error like missing pip package
          if (stderr.includes("ModuleNotFoundError")) {
            reject(
              new Error(`Missing Python dependency: ${stderr.split("\n")[0]}`),
            );
          } else {
            reject(
              new Error(
                `Browser process exited with code ${code}\nStderr: ${stderr}`,
              ),
            );
          }
        }
      });

      python.on("error", (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn browser process: ${error.message}`));
      });
    });
  }
}

// Singleton instance
export const browserBridge = new BrowserBridge();
