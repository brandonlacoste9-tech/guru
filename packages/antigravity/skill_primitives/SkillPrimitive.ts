/**
 * Antigravity – Immutable raw skill definition (directly mirrors the upstream SKILL.md)
 */

export interface SkillPrimitive {
  /** Unique identifier used throughout the system */
  id: string; // "browser-automation"
  /** Human‑readable name (may contain spaces) */
  name: string; // "Browser Automation"
  /** Short description – comes from the SKILL.md front‑matter */
  description: string;
  /** Category folder path within the repo (e.g. "skills/browser-automation") */
  repoPath: string;
  /** Extracted capability tags (e.g. ["playwright","headless‑browsers"]) */
  tags: string[];
  /** Structured patterns that the skill promises (optional, free‑form) */
  patterns?: string[];
  /** Optional anti‑patterns / sharp‑edges */
  antiPatterns?: string[];
}
