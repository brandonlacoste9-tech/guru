import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

/**
 * Flo‑Guru – Runtime skill‑mounting API
 *
 * The engine copies the immutable SKILL.md into a temporary folder,
 * injects its front‑matter into the LLM system prompt, and removes it
 * after execution.
 */

export type SkillId = string; // e.g. "browser-automation", "systematic-debugging"

export interface SkillMountOptions {
  /** Absolute path to the repository root that holds the original SKILL.md files */
  sourceRoot: string;
  /** Temporary location where the mounted copy will live for this request */
  mountRoot: string;
}

export class SkillMounting {
  constructor(private readonly defaultOpts: SkillMountOptions) {}

  /**
   * Mount a skill for the current request.
   * Returns the absolute path of the injected copy (for debugging / logging).
   */
  public async mountSkill(
    skillId: SkillId,
    opts: Partial<SkillMountOptions> = {}
  ): Promise<string> {
    const options = { ...this.defaultOpts, ...opts };
    
    // 1. Locate source SKILL.md (Naive implementation assumes simple ID->Path mapping or flat structure first)
    // Ideally this uses the skills_inventory.md or a lookup service.
    // For now assuming: sourceRoot/skills/skillId/SKILL.md OR sourceRoot/skillId/SKILL.md
    const possiblePaths = [
      path.join(options.sourceRoot, 'skills', skillId, 'SKILL.md'),
      path.join(options.sourceRoot, skillId, 'SKILL.md'),
    ];

    let sourcePath = '';
    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        sourcePath = p;
        break;
      } catch (e) {}
    }

    if (!sourcePath) {
      throw new Error(`Skill definition not found for ID: ${skillId} in ${options.sourceRoot}`);
    }

    // 2. Prepare mount path
    const mountPath = path.join(options.mountRoot, skillId, 'SKILL.md');
    await fs.mkdir(path.dirname(mountPath), { recursive: true });

    // 3. Copy file
    await fs.copyFile(sourcePath, mountPath);

    console.log(`[SkillMounting] Mounted ${skillId} to ${mountPath}`);
    return mountPath;
  }

  /**
   * Unmount a previously mounted skill – deletes the temporary copy.
   */
  public async unmountSkill(
    skillId: SkillId,
    opts: Partial<SkillMountOptions> = {}
  ): Promise<void> {
    const options = { ...this.defaultOpts, ...opts };
    const mountDir = path.join(options.mountRoot, skillId);

    try {
      await fs.rm(mountDir, { recursive: true, force: true });
      console.log(`[SkillMounting] Unmounted ${skillId}`);
    } catch (e) {
      console.warn(`[SkillMounting] Failed to unmount ${skillId}:`, e);
    }
  }

  /**
   * Utility – read the front‑matter of a mounted SKILL.md (used to prepend to LLM prompt).
   */
  public async readSkillFrontMatter(
    mountedSkillPath: string
  ): Promise<Record<string, unknown>> {
    const content = await fs.readFile(mountedSkillPath, 'utf8');
    const parsed = matter(content);
    return parsed.data;
  }
}
