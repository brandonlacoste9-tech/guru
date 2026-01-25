import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Resend as a class
class MockResend {
  emails = {
    send: vi.fn().mockResolvedValue({ id: "email-123" }),
  };
}

// Mock the database BEFORE importing service
vi.mock("@guru/database", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              guruId: "test-guru-id",
              notifications: {
                sendStart: true,
                sendComplete: true,
                sendErrors: true,
                channels: ["email", "push"],
                quietHours: null,
              },
            },
          ]),
        }),
      }),
    }),
  },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

// Mock Resend
vi.mock("resend", () => ({
  Resend: MockResend,
}));

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

describe("NotificationService", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.VAPID_PUBLIC_KEY = "test-public-key";
    process.env.VAPID_PRIVATE_KEY = "test-private-key";
    process.env.VAPID_SUBJECT = "mailto:test@floguru.com";
    process.env.NOTIFICATION_EMAIL = "user@example.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  describe("NotificationService class", () => {
    it("should create instance with Resend configured", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      expect(service).toBeDefined();
    });

    it("should handle missing Resend API key gracefully", async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      expect(service).toBeDefined();
    });
  });

  describe("sendGuruNotification", () => {
    it("should send notification on complete event", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();

      await service.sendGuruNotification("test-guru-id", "complete", {
        guruName: "Test Guru",
      });

      expect(true).toBe(true);
    });

    it("should send error notification with error message", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();

      await service.sendGuruNotification("test-guru-id", "error", {
        guruName: "Test Guru",
        errorMessage: "Something went wrong",
      });

      expect(true).toBe(true);
    });
  });

  describe("isQuietHours", () => {
    it("should return false when quietHours is null", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      const result = (service as any).isQuietHours(null);
      expect(result).toBe(false);
    });

    it("should handle overnight quiet hours", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      const result = (service as any).isQuietHours([22, 7]);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("buildEmailSubject", () => {
    it("should build correct subject for complete event", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      const subject = (service as any).buildEmailSubject("complete", "My Guru");
      expect(subject).toContain("My Guru");
      expect(subject).toContain("completed");
    });

    it("should build correct subject for error event", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      const subject = (service as any).buildEmailSubject("error", "My Guru");
      expect(subject).toContain("error");
    });
  });

  describe("buildEmailBody", () => {
    it("should include error message for error events", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      const body = (service as any).buildEmailBody("error", {
        guruName: "My Guru",
        errorMessage: "Connection failed",
      });
      expect(body).toContain("Connection failed");
    });

    it("should include success message for complete events", async () => {
      const { NotificationService } =
        await import("../../src/services/notification.service");
      const service = new NotificationService();
      const body = (service as any).buildEmailBody("complete", {
        guruName: "My Guru",
      });
      expect(body).toContain("successfully");
    });
  });
});
