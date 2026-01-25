import { HyperHealingOrchestrator } from "./HyperHealingOrchestrator";
import { db, automationSolutions, healingEvents } from "@guru/database";

// Mock the database
jest.mock("@guru/database", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    execute: jest.fn(),
  },
  automationSolutions: {
    errorSignature: "error_signature",
    confidenceScore: "confidence_score",
  },
  healingEvents: {},
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  gt: jest.fn(),
  sql: jest.fn((strings) => strings.join("")),
}));

// Mock AI Service
jest.mock("./aiService", () => ({
  aiService: {
    executeReasoning: jest.fn(),
  },
}));

describe("HyperHealingOrchestrator", () => {
  let orchestrator: HyperHealingOrchestrator;

  beforeEach(() => {
    orchestrator = new HyperHealingOrchestrator();
    jest.clearAllMocks();
  });

  describe("generateErrorFingerprint", () => {
    it("should generate consistent fingerprints for identical errors/contexts", async () => {
      const context = {
        error: new Error("Specific Selector Error"),
        step: { type: "CLICK" },
        browserContext: { browserType: "chromium", userAgent: "test-agent" },
        domain: "example.com",
        missionRunId: "run-1",
        guruId: "guru-1",
      };

      const fp1 = await orchestrator.generateErrorFingerprint(context);
      const fp2 = await orchestrator.generateErrorFingerprint(context);

      expect(fp1.signature).toBe(fp2.signature);
      expect(fp1.context.domain).toBe("example.com");
    });
  });

  describe("consultHealingMatrix", () => {
    it("should return cached solutions if confidence > 70", async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: "sol-1",
            solution: { type: "SELECTOR_FIX" },
            confidenceScore: 90,
          },
        ]),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const cached = await orchestrator.consultHealingMatrix({
        signature: "abc",
        context: {} as any,
      });

      expect(cached).toHaveLength(1);
      expect(cached[0].confidenceScore).toBe(90);
    });
  });

  describe("orchestrateHealing", () => {
    it("should prioritize matrix solutions over AI", async () => {
      // Mock db matrix returning a hit
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: "sol-1",
            solution: { type: "MATRIX_FIX" },
            confidenceScore: 95,
            successCount: 10,
            totalCount: 10,
          },
        ]),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const decision = await orchestrator.orchestrateHealing({
        error: new Error("Test"),
        domain: "test.com",
        browserContext: {} as any,
        step: {},
        missionRunId: "1",
        guruId: "1",
      });

      expect(decision.strategy).toBe("MATRIX_BASED");
      expect(decision.solution.type).toBe("MATRIX_FIX");
    });
  });
});
