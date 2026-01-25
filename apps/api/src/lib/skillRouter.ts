/**
 * SkillRouter — Selects domain-specific tools for Gurus based on intent.
 */

import {
  GuruDomain,
  DOMAIN_SKILL_MAP,
  UNIVERSAL_TOOLS,
  GURU_DOMAIN_PROFILES,
} from "./skillMapping";

export class SkillRouter {
  /**
   * Get tools for a Guru based on their domain and mission intent.
   * For the MVP, we return all skills in their assigned domains.
   */
  public getToolsForGuru(guruId: string): string[] {
    // 1. Identify Guru Domains
    // We'll normalize the guruId (slug) to find its profile
    const slug = guruId.toLowerCase().replace(/\s+/g, "");
    const domains = GURU_DOMAIN_PROFILES[slug] || [GuruDomain.UTILITY];

    // 2. Fetch Skills for those domains
    const domainSkills = domains.flatMap(
      (domain) => DOMAIN_SKILL_MAP[domain] || [],
    );

    // 3. Merge with Universal Tools
    const allTools = Array.from(new Set([...UNIVERSAL_TOOLS, ...domainSkills]));

    return allTools;
  }

  /**
   * Filter tools based on intent (optional/future enhancement).
   * Could use LLM reasoning to prune the tool list to avoid context bloat.
   */
  public routeByIntent(intent: string, availableTools: string[]): string[] {
    // Placeholder for intent-based filtering logic
    return availableTools;
  }
}

export const skillRouter = new SkillRouter();
