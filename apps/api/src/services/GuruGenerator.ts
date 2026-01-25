import { aiService } from "./aiService";

export interface GeneratedGuru {
  name: string;
  personality: "motivator" | "zen_master" | "analyst" | "professional";
  mission: string;
  steps: Array<{
    type: string;
    payload: any;
  }>;
}

export class GuruGenerator {
  /**
   * Generates a full Guru configuration from a natural language description
   */
  async generateFromPrompt(userInstruction: string): Promise<GeneratedGuru> {
    const systemPrompt = `You are the Architect, an advanced AI designed to build other AI Agents (Gurus).
    Your goal is to convert a user's intent into a structured automation definition.

    AVAILABLE STEPS:
    - NAVIGATE: { url: string }
    - CLICK: { selector: string }
    - FILL: { selector: string, text: string }
    - EXTRACT: { selector: string, variableName: string }
    - WAIT: { timeout: number }
    - SKILL: { skillName: string }

    Analyze the user's request. If they want to "book a gym class", infer the likely steps (Login -> Search -> Select -> Book).
    Since you cannot browse right now to get real selectors, use descriptive placeholders like "BUTTON_LOGIN" or "INPUT_EMAIL" so the user can fix them later in the Visual Builder.

    RETURN JSON ONLY. Do not include markdown formatting like \`\`\`json.
    Structure:
    {
      "name": "Creative Name (e.g. Gym Warrior)",
      "personality": "motivator" | "zen_master" | "analyst" | "professional",
      "mission": "A clear, first-person mission statement for the Guru.",
      "steps": [ ... ]
    }`;

    try {
      const result = await aiService.executeReasoning({
        systemPrompt,
        userPrompt: `Create a Guru that can: ${userInstruction}`,
        maxSteps: 5, // Keep it simple
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to generate valid JSON structure");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as GeneratedGuru;
    } catch (error) {
      console.error("Guru Generation Failed:", error);
      // Fallback template
      return {
        name: "New Guru",
        personality: "professional",
        mission: `I will assist you with "${userInstruction}"`,
        steps: [],
      };
    }
  }
}

export const guruGenerator = new GuruGenerator();
