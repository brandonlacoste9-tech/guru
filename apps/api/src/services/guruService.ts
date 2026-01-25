import {
  db,
  gurus,
  guruTemplates,
  guruExecutions,
  guruTemplateReviews,
  eq,
  and,
  desc,
  sql,
  guruAutomations,
} from "@guru/database";
import { automationService } from "./automationService";

export class GuruService {
  /**
   * CREATE Operations
   */
  async createGuruAutomation(data: any, userId: string) {
    const [newAutomation] = await db
      .insert(guruAutomations)
      .values({
        ...data,
        userId: userId,
      })
      .returning();
    return newAutomation;
  }

  async createGuru(data: any, userId: string) {
    const [newGuru] = await db
      .insert(gurus)
      .values({
        ...data,
        createdBy: userId,
        updatedAt: new Date(),
      })
      .returning();
    return newGuru;
  }

  async createGuruTemplate(data: any, userId: string) {
    const [template] = await db
      .insert(guruTemplates)
      .values({
        ...data,
        creatorId: userId,
        updatedAt: new Date(),
      })
      .returning();
    return template;
  }

  async createGuruFromTemplate(
    templateId: string,
    userId: string,
    customizations: any = {},
  ) {
    const [template] = await db
      .select()
      .from(guruTemplates)
      .where(eq(guruTemplates.id, templateId));
    if (!template) throw new Error("Template not found");

    const [newGuru] = await db
      .insert(gurus)
      .values({
        name: customizations.name || template.name,
        description: customizations.description || template.description,
        category: template.category,
        personality: customizations.personality || "motivator",
        automationIds: [], // User will need to add/configure their own instances
        createdBy: userId,
        isTemplate: false,
        isPublic: false,
        updatedAt: new Date(),
      })
      .returning();

    return newGuru;
  }

  /**
   * READ Operations
   */
  async getGuru(id: string, userId: string) {
    const [guru] = await db
      .select()
      .from(gurus)
      .where(and(eq(gurus.id, id), eq(gurus.createdBy, userId)));
    if (!guru) throw new Error("Guru not found or access denied");
    return guru;
  }

  async getGuruById(id: string) {
    const [guru] = await db.select().from(gurus).where(eq(gurus.id, id));
    return guru;
  }

  async listGurus(userId: string, filters: any = {}) {
    const conditions = [eq(gurus.createdBy, userId)];
    if (filters.category) {
      conditions.push(eq(gurus.category, filters.category));
    }
    return db
      .select()
      .from(gurus)
      .where(and(...conditions))
      .orderBy(desc(gurus.createdAt));
  }

  async listAllScheduledGurus() {
    // This is a placeholder for Week 2 integration
    // We'll need a way to filter gurus that have automations with schedules
    return db.select().from(gurus).where(eq(gurus.enabled, true));
  }

  async listGuruTemplates(filters: any = {}) {
    const conditions = [eq(guruTemplates.published, true)];
    if (filters.category) {
      conditions.push(eq(guruTemplates.category, filters.category));
    }
    if (filters.featured) {
      conditions.push(eq(guruTemplates.featured, true));
    }
    return db
      .select()
      .from(guruTemplates)
      .where(and(...conditions))
      .orderBy(desc(guruTemplates.downloads));
  }

  async getGuruExecutions(guruId: string, limit: number = 10) {
    return db
      .select()
      .from(guruExecutions)
      .where(eq(guruExecutions.guruId, guruId))
      .orderBy(desc(guruExecutions.createdAt))
      .limit(limit);
  }

  /**
   * UPDATE Operations
   */
  async updateGuru(id: string, userId: string, data: any) {
    const [updatedGuru] = await db
      .update(gurus)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(gurus.id, id), eq(gurus.createdBy, userId)))
      .returning();
    return updatedGuru;
  }

  async incrementGuruRun(guruId: string, success: boolean) {
    await db
      .update(gurus)
      .set({
        totalRuns: sql`total_runs + 1`,
        successfulRuns: success
          ? sql`successful_runs+ 1`
          : sql`successful_runs`,
        currentStreak: success ? sql`current_streak + 1` : 0,
        updatedAt: new Date(),
      })
      .where(eq(gurus.id, guruId));
  }

  /**
   * LOGGING
   */
  async logExecution(data: any) {
    const [execution] = await db
      .insert(guruExecutions)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return execution;
  }

  /**
   * DELETE
   */
  async deleteGuru(id: string, userId: string) {
    const [deleted] = await db
      .delete(gurus)
      .where(and(eq(gurus.id, id), eq(gurus.createdBy, userId)))
      .returning();
    return deleted;
  }
}

export const guruService = new GuruService();
