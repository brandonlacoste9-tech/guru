import { db, userProfiles, eq, and } from "@guru/database";
import * as fs from "fs";
import * as path from "path";

export class UserProfileService {
  private baseProfileDir: string;

  constructor() {
    this.baseProfileDir = path.join(__dirname, "../../profiles");
    if (!fs.existsSync(this.baseProfileDir)) {
      fs.mkdirSync(this.baseProfileDir, { recursive: true });
    }
  }

  /**
   * Get or create a browser profile path for a Guru
   */
  async getOrCreateProfile(
    userId: string,
    guruId: string,
    profileName: string,
  ) {
    // 1. Check if profile exists in DB
    const [existing] = await db
      .select()
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.userId, userId),
          eq(userProfiles.guruId, guruId),
          eq(userProfiles.name, profileName),
        ),
      );

    if (existing) {
      // Update last used
      await db
        .update(userProfiles)
        .set({ lastUsedAt: new Date(), updatedAt: new Date() })
        .where(eq(userProfiles.id, existing.id));

      return existing;
    }

    // 2. Create directory structure
    const profileFolder = path.join(
      this.baseProfileDir,
      userId,
      guruId,
      profileName,
    );
    if (!fs.existsSync(profileFolder)) {
      fs.mkdirSync(profileFolder, { recursive: true });
    }

    // 3. Register in DB
    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        userId,
        guruId,
        name: profileName,
        profilePath: profileFolder,
        browserType: "chromium",
        isActive: true,
      })
      .returning();

    return newProfile;
  }

  /**
   * List all profiles for a Guru
   */
  async listProfiles(userId: string, guruId: string) {
    return db
      .select()
      .from(userProfiles)
      .where(
        and(eq(userProfiles.userId, userId), eq(userProfiles.guruId, guruId)),
      );
  }

  /**
   * Delete a profile and its files
   */
  async deleteProfile(profileId: string, userId: string) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(
        and(eq(userProfiles.id, profileId), eq(userProfiles.userId, userId)),
      );

    if (!profile) throw new Error("Profile not found or access denied");

    // Remove folder
    if (fs.existsSync(profile.profilePath)) {
      fs.rmSync(profile.profilePath, { recursive: true, force: true });
    }

    // Remove from DB
    return db.delete(userProfiles).where(eq(userProfiles.id, profileId));
  }
}

export const userProfileService = new UserProfileService();
