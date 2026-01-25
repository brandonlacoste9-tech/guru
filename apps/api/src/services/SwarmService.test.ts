import { swarmService } from "./SwarmService";
import { redisManager } from "../lib/redis";

// Mock redisManager
jest.mock("../lib/redis", () => ({
  redisManager: {
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockImplementation((channel, cb) => {
      // Simulate immediate subscription
      return Promise.resolve();
    }),
    hset: jest.fn().mockResolvedValue(1),
    hgetAll: jest.fn().mockResolvedValue({
      "guru-1": JSON.stringify({ guruId: "guru-1", finding: "test" }),
    }),
    expire: jest.fn().mockResolvedValue(1),
    queueClient: {},
  },
}));

describe("SwarmService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset private state if possible, or just re-init
    // Since singleton, state persists. We might need to clear activeGurus via 'any' cast or add clear method.
    (swarmService as any).activeGurus.clear();
  });

  it("should broadcast status on join", async () => {
    await swarmService.joinSwarm("guru-1", "Test Guru");
    expect(redisManager.publish).toHaveBeenCalledWith(
      "swarm:broadcast:status",
      expect.stringContaining("guru-1"),
    );
  });

  it("should handle joining swarm multiple times gracefully", async () => {
    await swarmService.joinSwarm("guru-1", "Test Guru");
    await swarmService.joinSwarm("guru-1", "Test Guru");
    expect(redisManager.publish).toHaveBeenCalledTimes(2);
  });

  it("should share memory correctly", async () => {
    await swarmService.shareMemory("mission-1", "guru-1", { data: "test" });
    expect(redisManager.hset).toHaveBeenCalledWith(
      "swarm:memory:mission-1",
      "guru-1",
      expect.any(String),
    );
    expect(redisManager.publish).toHaveBeenCalledWith(
      "swarm:memory:share",
      expect.any(String),
    );
  });

  it("should retrieve collective knowledge", async () => {
    const knowledge = await swarmService.getCollectiveKnowledge("mission-1");
    expect(knowledge).toHaveLength(1);
    expect(knowledge[0].guruId).toBe("guru-1");
  });
});
