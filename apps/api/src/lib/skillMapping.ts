/**
 * Domain-specific tool mapping for FloGuru pilots.
 * Each domain restricts which subset of the 222+ skills are available.
 */

export enum GuruDomain {
  PRODUCTIVITY = "productivity",
  FITNESS = "fitness",
  MINDFULNESS = "mindfulness",
  STUDY = "study",
  COMMUNICATION = "communication",
  RESEARCH = "research",
  CREATIVITY = "creativity",
  UTILITY = "utility",
}

export const UNIVERSAL_TOOLS = [
  "systematic-debugging",
  "brainstorming",
  "planning-with-files",
  "browser-use",
];

export const DOMAIN_SKILL_MAP: Record<GuruDomain, string[]> = {
  [GuruDomain.PRODUCTIVITY]: [
    "writing-plans",
    "executing-plans",
    "doc-coauthoring",
    "docx-official",
    "xlsx-official",
    "pptx-official",
    "pdf-official",
    "file-organizer",
    "workflow-automation",
    "kaizen",
    "concise-planning",
    "micro-saas-launcher",
    "onboarding-cro",
    "page-cro",
    "signup-flow-cro",
  ],
  [GuruDomain.FITNESS]: [
    "kaizen",
    "cc-skill-continuous-learning",
    "ai-product",
    "marketing-psychology",
    "content-creator",
  ],
  [GuruDomain.MINDFULNESS]: [
    "behavioral-modes",
    "brainstorming",
    "conversation-memory",
    "agent-memory-systems",
  ],
  [GuruDomain.STUDY]: [
    "notebooklm",
    "research-engineer",
    "context-window-management",
    "senior-architect",
    "senior-fullstack",
    "ai-agents-architect",
  ],
  [GuruDomain.COMMUNICATION]: [
    "email-sequence",
    "email-systems",
    "slack-bot-builder",
    "discord-bot-architect",
    "internal-comms-anthropic",
    "internal-comms-community",
    "copy-editing",
    "copywriting",
  ],
  [GuruDomain.RESEARCH]: [
    "competitor-alternatives",
    "autonomous-agents",
    "shodan-reconnaissance",
    "ethical-hacking-methodology",
    "scanning-tools",
    "burp-suite-testing",
    "cloud-penetration-testing",
    "aws-penetration-testing",
  ],
  [GuruDomain.CREATIVITY]: [
    "algorithmic-art",
    "canvas-design",
    "ui-ux-pro-max",
    "web-artifacts-builder",
    "theme-factory",
    "3d-web-experience",
    "remotion-best-practices",
    "interactive-portfolio",
    "scroll-experience",
  ],
  [GuruDomain.UTILITY]: [
    "mcp-builder",
    "skill-creator",
    "writing-skills",
    "bash-linux",
    "powershell-windows",
    "python-patterns",
    "nodejs-best-practices",
    "typescript-expert",
    "docker-expert",
    "prisma-expert",
    "neon-postgres",
    "deployment-procedures",
    "server-management",
    "vulnerability-scanner",
  ],
};

export const GURU_DOMAIN_PROFILES: Record<string, GuruDomain[]> = {
  productivityflow: [
    GuruDomain.PRODUCTIVITY,
    GuruDomain.COMMUNICATION,
    GuruDomain.UTILITY,
  ],
  fitnessflow: [GuruDomain.FITNESS, GuruDomain.UTILITY],
  zenflow: [GuruDomain.MINDFULNESS, GuruDomain.COMMUNICATION],
  studyflow: [GuruDomain.STUDY, GuruDomain.RESEARCH, GuruDomain.UTILITY],
};
