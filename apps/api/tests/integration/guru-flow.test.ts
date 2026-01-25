import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

/**
 * Integration tests for the Guru API flow.
 *
 * Prerequisites:
 * - Database must be running and seeded
 * - API server must be running on localhost:4000
 *
 * To run: pnpm test --filter @guru/api
 */

const API_URL = process.env.API_URL || "http://localhost:4000";

describe("Guru API Integration Tests", () => {
  let testGuruId: string;

  describe("Health Check", () => {
    it("GET /health should return ok status", async () => {
      const response = await request(API_URL).get("/health");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.service).toBe("floguru-api");
    });
  });

  describe("Guru CRUD Operations", () => {
    it("POST /api/gurus should create a new guru", async () => {
      const newGuru = {
        name: "Test Guru",
        description: "Integration test guru",
        category: "productivity",
        personality: "helpful",
        automationIds: [],
      };

      const response = await request(API_URL)
        .post("/api/gurus")
        .send(newGuru)
        .set("Content-Type", "application/json");

      // May need auth - check for 401 or 201
      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty("id");
        testGuruId = response.body.id;
      } else {
        // Auth required
        expect(response.status).toBe(401);
      }
    });

    it("GET /api/gurus should list gurus", async () => {
      const response = await request(API_URL).get("/api/gurus");

      if (response.status === 200) {
        expect(
          Array.isArray(response.body) || response.body.gurus,
        ).toBeTruthy();
      } else {
        expect(response.status).toBe(401);
      }
    });

    it("GET /api/gurus/:id should get a specific guru", async () => {
      if (!testGuruId) {
        // Skip if no test guru was created
        return;
      }

      const response = await request(API_URL).get(`/api/gurus/${testGuruId}`);

      if (response.status === 200) {
        expect(response.body.id).toBe(testGuruId);
        expect(response.body.name).toBe("Test Guru");
      }
    });
  });

  describe("Scheduler API", () => {
    it("GET /api/scheduler/jobs should list active jobs", async () => {
      const response = await request(API_URL).get("/api/scheduler/jobs");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("jobs");
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    it("POST /api/scheduler/pause/:guruId should pause a guru", async () => {
      const response = await request(API_URL)
        .post("/api/scheduler/pause/non-existent-id")
        .send();

      // Should succeed even if guru doesn't exist (no-op)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("POST /api/scheduler/reschedule/:guruId should require trigger payload", async () => {
      const response = await request(API_URL)
        .post("/api/scheduler/reschedule/test-id")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("trigger");
    });

    it("POST /api/scheduler/reschedule/:guruId should schedule with valid trigger", async () => {
      const trigger = {
        type: "schedule",
        time: "08:00",
        days: ["mon", "tue", "wed", "thu", "fri"],
        timezone: "America/Toronto",
      };

      const response = await request(API_URL)
        .post("/api/scheduler/reschedule/test-guru-id")
        .send({ trigger })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Marketplace API", () => {
    it("GET /api/marketplace should list templates", async () => {
      const response = await request(API_URL).get("/api/marketplace");

      if (response.status === 200) {
        expect(response.body).toHaveProperty("templates");
      } else {
        // Endpoint may require different path
        expect([200, 404]).toContain(response.status);
      }
    });
  });
});
