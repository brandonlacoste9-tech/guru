import * as fs from "fs";
import * as path from "path";
import {
  db,
  gurus,
  guruAutomations,
  guruExecutions,
  users,
  eq,
  and,
} from "@guru/database";
import { automationService } from "./automationService";
import { SocketService } from "./socketService";
import { guruService } from "./guruService";
import { userProfileService } from "./userProfileService";
import { notificationService } from "./notificationService";
import { getTracer } from "../lib/tracing";
import { SpanStatusCode } from "@opentelemetry/api";
import { skillRouter } from "../lib/skillRouter";
import { metaLearningService } from "./metaLearningService";
import { missionRunService } from "./missionRunService";

const tracer = getTracer("guru-executor-service");
import { SkillMounting } from "./cognition/SkillMounting";

export class GuruExecutorService {
  /**
   * Execute a specific automation for a Guru
   */
  async executeGuruAutomation(
    guruId: string,
    automationId: string,
    triggeredBy: string = "manual",
    options: {
      taskDescription?: string;
      profileName?: string;
      userId?: string;
    } = {},
  ) {
    const { taskDescription, profileName, userId = "test-user" } = options;
    const startTime = new Date();

    const span = tracer.startSpan(`GuruExecution: ${automationId || guruId}`, {
      attributes: {
        "guru.id": guruId,
        "automation.id": automationId,
        triggered_by: triggeredBy,
        "user.id": userId,
      },
    });

    // 0. Initialize Skill Mounting (before try block for finally access)
    const skillMounting = new SkillMounting({
      // TODO: Move paths to config
      sourceRoot: path.join(process.cwd(), "../../awesome-skills"),
      mountRoot: path.join(process.cwd(), "skills/mounted_skills"),
    });
    const mountedSkillIds: string[] = [];

    try {
      // 1. Fetch Guru
      const [guru] = await db.select().from(gurus).where(eq(gurus.id, guruId));
      if (!guru) throw new Error(`Guru (${guruId}) not found.`);

      // 2. Fetch Automation or use standalone
      let taskToRun = "";
      let automationName = "Manual Task";
      const executionId =
        automationId === "standalone-task"
          ? "00000000-0000-0000-0000-000000000000"
          : automationId;

      if (automationId && automationId !== "standalone-task") {
        const [automation] = await db
          .select()
          .from(guruAutomations)
          .where(
            and(
              eq(guruAutomations.id, automationId),
              eq(guruAutomations.guruId, guruId),
            ),
          );
        if (automation) {
          taskToRun = automation.taskDescription;
          automationName = automation.name;
        }
      }

      // If standalone task message provided in context
      if (taskDescription) {
        taskToRun = taskDescription;
      } else if (!taskToRun) {
        taskToRun = `Execute based on your mission: ${guru.description}`;
      }

      // 3. Setup Persistent Identity
      let activeProfileName: string | undefined;
      if (profileName) {
        const profile = await userProfileService.getOrCreateProfile(
          userId,
          guruId,
          profileName,
        );
        // We pass a relative path-like name to the bridge which appends it to 'profiles/'
        activeProfileName = `${userId}/${guruId}/${profileName}`;
      }

      // 4. Initialize Mission Run Intelligence
      const missionRun = await missionRunService.createRun(userId, guruId);
      const executionIdForSocket =
        executionId === "standalone-task" ? missionRun.id : executionId;

      console.log(
        `🤖 Guru ${guru.name} is starting mission ${missionRun.id}: ${automationName}`,
      );
      SocketService.emitStatus(
        executionIdForSocket,
        "running",
        `${guru.name} is starting: ${automationName}`,
      );

      // --- SKILL MOUNTING START ---
      const expertTools = skillRouter.getToolsForGuru(guru.id);
      // expertTools is an array of skill names (strings), filter out non-expert ones if needed
      const skillsToMount = expertTools.filter((skillName) =>
        skillName.startsWith("expert_") || !skillName.startsWith("browse_")
      );

      let mountedContext = "";

      if (skillsToMount.length > 0) {
        console.log(
          `🔌 Mounting skills for ${guru.name}: ${skillsToMount.join(", ")}`,
        );
        for (const skillId of skillsToMount) {
          try {
            const mountPath = await skillMounting.mountSkill(skillId);
            mountedSkillIds.push(skillId);

            const meta = await skillMounting.readSkillFrontMatter(mountPath);
            mountedContext += `\n[SKILL: ${skillId}]\n${meta.description || "Active"}\n(Instructions loaded from ${mountPath})\n`;
          } catch (e) {
            console.error(`Failed to mount skill ${skillId}:`, e);
          }
        }
      }
      // --- SKILL MOUNTING END ---

      // 2. Build the "Soul" - The specialized personality prompt
      const personalityPrompt =
        (await this.buildPersonalityPrompt(guru)) +
        (mountedContext ? `\n\nMOUNTED CAPABILITIES:\n${mountedContext}` : "");

      // 3. Trigger the base automation service with personality context
      const { aiService } = await import("./aiService");
      const { cognitiveEngine } = await import("./antigravity/cognition");

      // --- COGNITION LOOP START ---
      const assessment = await aiService.getSelfAssessment({
        taskDescription: taskToRun,
        guru,
      });

      const tools = skillRouter.getToolsForGuru(guru.id);
      const cogDecision = await cognitiveEngine.decideForTask(
        {
          id: missionRun.id,
          description: taskToRun,
          availableSkills: tools,
          personality: (guru as any).personalityBias,
        },
        assessment,
      );

      console.log(
        `🧠 [COGNITION] Archetype: ${cogDecision.archetype} | Action: ${cogDecision.recommendation} | Reason: ${cogDecision.reason}`,
      );
      SocketService.emitStatus(
        executionIdForSocket,
        "running",
        `[COGNITION] ${cogDecision.archetype}: ${cogDecision.recommendation} (${cogDecision.reason})`,
      );

      if (cogDecision.recommendation === "seek_guidance") {
        throw new Error(
          `[Cognition Halt] Safety check triggered. Action: seek_guidance. Reason: ${cogDecision.reason}`,
        );
      }
      // --- COGNITION LOOP END ---

      const executionResult = await automationService.executeWithSelfHealing(
        `${guru.name}: ${automationName}`,
        executionIdForSocket,
        async () => {
          const tools = skillRouter.getToolsForGuru(guru.id);
          return aiService.executeReasoning({
            systemPrompt: personalityPrompt,
            userPrompt: `STARTING TASK: ${taskToRun}`,
            guruId: guru.id,
            maxSteps: 30,
            tools: tools,
            meta: {
              personality: (guru as any).personalityBias,
              globalConfidence: cogDecision.assessment.skill_sufficiency,
            },
          });
        },

        { profileName: activeProfileName },
      );

      // --- Meta-Learning Reporting ---
      const usedExpertSkills = new Set<string>();
      // executionResult may contain tool call info in data
      if (executionResult.data?.toolCalls) {
        executionResult.data.toolCalls.forEach((tc: any) => {
          if (
            tc.toolName === "lookup_expert_skill" ||
            tc.toolName === "execute_skill_script"
          ) {
            const skillName = tc.args.skillName;
            if (skillName) usedExpertSkills.add(skillName);
          }
        });
      }

      const durationMs = Date.now() - startTime.getTime();

      // If any expert skills were used, record them.
      // Falling back to a "general_reasoning" skill if none were called.
      const skillsToReport =
        usedExpertSkills.size > 0
          ? Array.from(usedExpertSkills)
          : ["general_reasoning"];

      for (const skill of skillsToReport) {
        metaLearningService.recordExperience({
          skillName: skill,
          domain: guru.category,
          success: executionResult.success,
          durationMs: durationMs / skillsToReport.length,
        });
      }

      // --- RECORD OUTCOME ---
      await cognitiveEngine.recordOutcome(missionRun.id, {
        success: executionResult.success,
        durationMs: Date.now() - startTime.getTime(),
        error: executionResult.error,
      });

      // 7. Finalize Mission Run Intelligence
      await missionRunService.finalizeRun(missionRun.id, executionResult);

      // 4. Log the execution
      await guruService.logExecution({
        guruId: guru.id,
        automationId: executionId,
        triggeredBy,
        status: executionResult.success
          ? executionResult.fixedByAgent
            ? "healed"
            : "success"
          : "failed",
        errorMessage: executionResult.error,
        executionTimeMs: Date.now() - startTime.getTime(),
        startedAt: startTime,
        completedAt: new Date(),
      });

      // 5. Update Guru stats
      await guruService.incrementGuruRun(guru.id, executionResult.success);

      // 6. Notify User (Fire & Forget)
      // In a real app we would fetch the user from the automation or guru owner
      // const [user] = await db.select().from(users).where(eq(users.id, userId));

      const adminEmail = "admin@floguru.com"; // Default for prototype

      await notificationService.sendEmail({
        to: adminEmail,
        subject: `[${
          executionResult.success ? "✅ Success" : "❌ Failed"
        }] ${guru.name}: ${automationName}`,
        html: `
            <h1>Mission Report from ${guru.name}</h1>
            <p><strong>Task:</strong> ${taskToRun}</p>
            <p><strong>Status:</strong> ${
              executionResult.success ? "Completed Successfully" : "Failed"
            }</p>
            <p><strong>Duration:</strong> ${(
              (Date.now() - startTime.getTime()) /
              1000
            ).toFixed(1)}s</p>
            ${
              executionResult.error
                ? `<div style="background:#fee;padding:10px;border-radius:5px;color:red;">Error: ${executionResult.error}</div>`
                : ""
            }
            <br/>
            <a href="http://localhost:3000/dashboard">View Full Logs</a>
        `,
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return executionResult;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      console.error(`💥 Fatal error in Guru execution:`, error.message);

      // Log the failure
      await guruService.logExecution({
        guruId,
        automationId:
          automationId === "standalone-task"
            ? "00000000-0000-0000-0000-000000000000"
            : automationId,
        triggeredBy,
        status: "failed",
        errorMessage: error.message,
        startedAt: startTime,
        completedAt: new Date(),
      });

      throw error;
    } finally {
      span.end();
      // --- SKILL UNMOUNTING ---
      if (typeof skillMounting !== "undefined") {
        for (const skillId of mountedSkillIds) {
          try {
            await skillMounting.unmountSkill(skillId);
          } catch (e) {
            console.error(`Error unmounting ${skillId}:`, e);
          }
        }
      }
    }
  }

  /**
   * Constructs a specialized system prompt based on Guru personality and identity.
   * Also injects persistent memory from findings.md and task_plan.md if they exist.
   */
  private async buildPersonalityPrompt(guru: any): Promise<string> {
    const memoryDir = path.join(process.cwd(), "memory", `guru-${guru.id}`);
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    const findingsPath = path.join(memoryDir, "findings.md");
    const planPath = path.join(memoryDir, "task_plan.md");

    let memoryContext = "";
    if (fs.existsSync(findingsPath)) {
      const findings = fs.readFileSync(findingsPath, "utf-8");
      memoryContext += `\nPAST FINDINGS:\n${findings}\n`;
    }
    if (fs.existsSync(planPath)) {
      const plan = fs.readFileSync(planPath, "utf-8");
      memoryContext += `\nCURRENT TASK PLAN:\n${plan}\n`;
    }

    const base = `You are ${guru.name}, a specialized AI Guru in the category of ${guru.category}.
Your personality is defined as: ${guru.personality}.
Your mission: ${guru.description}

COMMUNICATION STYLE:
${guru.systemPrompt || "Be helpful, efficient, and direct."}

${guru.sampleMessages?.length ? `EXAMPLE RESPONSES:\n${guru.sampleMessages.join("\n")}` : ""}

PERMANENT MEMORY & CONTEXT:
${memoryContext || "No past findings yet. You are starting fresh."}

When performing browser tasks:
1. Always act in alignment with your persona.
2. If you find something new, use the 'save_finding' tool to remember it for future runs.
3. If you make progress on a long-term goal, update your 'task_plan' accordingly.
4. If you succeed, give a closing comment in your specific voice.
5. If you encounter a paywall or login you don't have, explain it in character.`;

    return base;
  }

  /**
   * Run all scheduled automations for a Guru (called by the Scheduler)
   */
  async runScheduledTasks(guruId: string) {
    const tasks = await db
      .select()
      .from(guruAutomations)
      .where(
        and(
          eq(guruAutomations.guruId, guruId),
          // In a real app, you'd check the schedule logic here
          // For now, we'll fetch all linked automations
        ),
      );

    for (const task of tasks) {
      // Here you would check if it's actually "due"
      // For the sake of the engine showcase, we'll trigger it
      await this.executeGuruAutomation(guruId, task.id, "schedule");
    }
  }
}

export const guruExecutorService = new GuruExecutorService();
