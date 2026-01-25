import path from "path";
import fs from "fs";
import { SkillMounting } from "../src/services/cognition/SkillMounting";

// Configuration
const REPO_ROOT = path.join(process.cwd(), "../../awesome-skills");
const MOUNT_ROOT = path.join(process.cwd(), "skills/mounted_skills");
const SKILL_ID = "api-security-best-practices";

async function main() {
  console.log("🧪 Starting Skill Mounting Verification...");
  console.log(`📂 Source: ${REPO_ROOT}`);
  console.log(`📂 Mount: ${MOUNT_ROOT}`);

  const mounting = new SkillMounting({
    sourceRoot: REPO_ROOT,
    mountRoot: MOUNT_ROOT,
  });

  try {
    // 1. Mount
    console.log(`\n➡️  Mounting skill: ${SKILL_ID}...`);
    const mountedPath = await mounting.mountSkill(SKILL_ID);

    if (fs.existsSync(mountedPath)) {
      console.log(`✅ Success: File exists at ${mountedPath}`);
    } else {
      console.error(`❌ Failure: File not found at ${mountedPath}`);
      process.exit(1);
    }

    // 2. Read
    console.log(`\n📖 Reading front-matter...`);
    const meta = await mounting.readSkillFrontMatter(mountedPath);
    console.log(`✅ Name: ${meta.name}`);
    console.log(`✅ Description: ${meta.description?.slice(0, 50)}...`);

    // 3. Unmount
    console.log(`\n⬅️  Unmounting skill...`);
    await mounting.unmountSkill(SKILL_ID);

    if (!fs.existsSync(mountedPath)) {
      console.log(`✅ Success: File removed.`);
    } else {
      console.error(`❌ Failure: File still exists at ${mountedPath}`);
      process.exit(1);
    }

    console.log("\n✨ Verification Complete: System Ready.");
  } catch (e) {
    console.error("💥 Verification Failed:", e);
    process.exit(1);
  }
}

main();
