import * as fs from "fs";
import * as path from "path";
import { DOMAIN_SKILL_MAP, UNIVERSAL_TOOLS } from "../src/lib/skillMapping";

/**
 * Diagnostic script to verify skill reachability.
 */
async function verifySkills() {
  const rootDir = path.join(__dirname, "..", "..", "..");
  const skillsDir = path.join(
    rootDir,
    ".agent",
    "external-skills",
    "antigravity-awesome-skills",
    "skills",
  );
  const localSkillsDir = path.join(rootDir, ".agent", "skills");

  const allSkills = new Set<string>();

  // Collect all installed skills
  if (fs.existsSync(skillsDir)) {
    fs.readdirSync(skillsDir).forEach((file) => {
      if (fs.statSync(path.join(skillsDir, file)).isDirectory()) {
        allSkills.add(file);
      }
    });
  }

  if (fs.existsSync(localSkillsDir)) {
    fs.readdirSync(localSkillsDir).forEach((file) => {
      if (fs.statSync(path.join(localSkillsDir, file)).isDirectory()) {
        allSkills.add(file);
      }
    });
  }

  console.log(`🔍 Total Skills Found: ${allSkills.size}`);

  // Map reachability
  const reachableSkills = new Set<string>(UNIVERSAL_TOOLS);
  Object.values(DOMAIN_SKILL_MAP).forEach((skills) => {
    skills.forEach((s) => reachableSkills.add(s));
  });

  console.log(`🎯 Reachable Skills: ${reachableSkills.size}`);

  const orphanSkills = [...allSkills].filter((s) => !reachableSkills.has(s));

  if (orphanSkills.length > 0) {
    console.warn(
      `⚠️ Found ${orphanSkills.length} orphan skills (not assigned to any domain):`,
    );
    // List first 10
    console.warn(
      orphanSkills.slice(0, 10).join(", ") +
        (orphanSkills.length > 10 ? "..." : ""),
    );
  } else {
    console.log(`✅ All skills are reachable!`);
  }

  // Check for broken mappings (mapped but not found in FS)
  const brokenMapped = [...reachableSkills].filter(
    (s) => !allSkills.has(s) && !UNIVERSAL_TOOLS.includes(s),
  );
  if (brokenMapped.length > 0) {
    console.error(
      `❌ Found ${brokenMapped.length} broken mappings (mapped but missing from FS):`,
    );
    console.error(brokenMapped.join(", "));
  }
}

verifySkills().catch((err) => {
  console.error(err);
  process.exit(1);
});
