import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Create a mock CronJob class
class MockCronJob {
  private callback: () => void;

  constructor(
    expr: string,
    callback: () => void,
    onComplete: any,
    start: boolean,
    timezone?: string,
  ) {
    this.callback = callback;
  }

  start() {}
  stop() {}
  nextDate() {
    return { toISO: () => "2026-01-23T06:00:00.000Z" };
  }
}

// Mock cron BEFORE importing the service
vi.mock("cron", () => ({
  CronJob: MockCronJob,
}));

// Mock the database
vi.mock("@guru/database", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  isNotNull: vi.fn((col) => ({ col, op: "isNotNull" })),
}));

// Mock notification service
vi.mock("../../src/services/notification.service", () => ({
  notificationService: {
    sendGuruNotification: vi.fn(),
  },
}));

describe("SchedulerService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("buildCronExpression", () => {
    it("should build correct cron expression for daily schedule", async () => {
      const { SchedulerService } =
        await import("../../src/services/scheduler.service");
      const service = new SchedulerService();
      const trigger = { time: "06:00", days: ["*"] };
      const result = (service as any).buildCronExpression(trigger);
      expect(result.expr).toBe("0 0 6 * * *");
    });

    it("should build correct cron expression for weekdays", async () => {
      const { SchedulerService } =
        await import("../../src/services/scheduler.service");
      const service = new SchedulerService();
      const trigger = {
        time: "08:00",
        days: ["mon", "tue", "wed", "thu", "fri"],
      };
      const result = (service as any).buildCronExpression(trigger);
      expect(result.expr).toBe("0 0 8 * * mon,tue,wed,thu,fri");
    });

    it("should handle timezone", async () => {
      const { SchedulerService } =
        await import("../../src/services/scheduler.service");
      const service = new SchedulerService();
      const trigger = {
        time: "09:00",
        days: ["mon"],
        timezone: "America/Toronto",
      };
      const result = (service as any).buildCronExpression(trigger);
      expect(result.timezone).toBe("America/Toronto");
    });
  });

  describe("scheduleAutomation", () => {
    it("should add job to internal map", async () => {
      const { SchedulerService } =
        await import("../../src/services/scheduler.service");
      const service = new SchedulerService();
      const trigger = { time: "07:00", days: ["*"] };
      await service.scheduleAutomation("test-automation-id", trigger);

      const jobs = service.listJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].id).toBe("test-automation-id");
    });
  });

  describe("unscheduleAutomation", () => {
    it("should remove job from internal map", async () => {
      const { SchedulerService } =
        await import("../../src/services/scheduler.service");
      const service = new SchedulerService();
      const trigger = { time: "07:00", days: ["*"] };
      await service.scheduleAutomation("test-automation-id", trigger);
      await service.unscheduleAutomation("test-automation-id");

      const jobs = service.listJobs();
      expect(jobs.length).toBe(0);
    });
  });

  describe("listJobs", () => {
    it("should return all active jobs with next run time", async () => {
      const { SchedulerService } =
        await import("../../src/services/scheduler.service");
      const service = new SchedulerService();
      const trigger = { time: "06:00", days: ["*"] };
      await service.scheduleAutomation("job-1", trigger);
      await service.scheduleAutomation("job-2", trigger);

      const jobs = service.listJobs();
      expect(jobs.length).toBe(2);
      expect(jobs[0]).toHaveProperty("id");
      expect(jobs[0]).toHaveProperty("nextRun");
    });
  });
});
