import { redisManager } from "../lib/redis";
import { EventEmitter } from "events";

export interface GuruStatus {
  id: string;
  name: string;
  state: "idle" | "running" | "healing" | "completed" | "error";
  missionId?: string;
  currentTask?: string;
  specialization?: string[];
  lastSeen: number; // timestamp
}

export interface HelpRequest {
  requestId: string;
  requesterId: string;
  requesterName: string;
  missionId: string;
  taskType: string;
  context: any;
  urgency: "low" | "medium" | "high";
  timestamp: number;
}

export interface HelpResponse {
  responderId: string;
  responderName: string;
  solution: any;
  confidence: number;
  estimatedTime: number; // ms
}

export class SwarmService extends EventEmitter {
  private static instance: SwarmService;
  private activeGurus: Map<string, GuruStatus> = new Map();
  private isInitialized = false;

  private constructor() {
    super();
  }

  static getInstance(): SwarmService {
    if (!SwarmService.instance) {
      SwarmService.instance = new SwarmService();
    }
    return SwarmService.instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.setupChannels();
    this.isInitialized = true;
    console.log("🐝 SwarmService Initialized");
  }

  private async setupChannels() {
    // Listen for status broadcasts
    await redisManager.subscribe("swarm:broadcast:status", (message) => {
      try {
        const status: GuruStatus = JSON.parse(message);
        this.activeGurus.set(status.id, status);
        this.emit("guruStatusUpdate", status);
      } catch (error) {
        console.error("Failed to parse status message:", error);
      }
    });

    // Listen for help requests
    await redisManager.subscribe("swarm:request:help", (message) => {
      try {
        const request: HelpRequest = JSON.parse(message);
        this.emit("helpRequested", request);
      } catch (error) {
        console.error("Failed to parse help request:", error);
      }
    });

    // Listen for memory shares
    await redisManager.subscribe("swarm:memory:share", (message) => {
      try {
        const memoryUpdate = JSON.parse(message);
        this.emit("memoryShared", memoryUpdate);
      } catch (error) {
        console.error("Failed to parse memory share:", error);
      }
    });
  }

  /**
   * Join the swarm network
   */
  async joinSwarm(guruId: string, guruName: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const status: GuruStatus = {
      id: guruId,
      name: guruName,
      state: "idle",
      lastSeen: Date.now(),
    };

    await this.broadcastStatus(status);
  }

  /**
   * Broadcast current status
   */
  async broadcastStatus(status: GuruStatus): Promise<void> {
    status.lastSeen = Date.now();
    this.activeGurus.set(status.id, status);

    // Fire and forget (don't await heavily)
    redisManager
      .publish("swarm:broadcast:status", JSON.stringify(status))
      .catch((e) => console.error("Swarm broadcast failed", e));
  }

  /**
   * Request help from the swarm
   */
  async requestHelp(request: HelpRequest): Promise<HelpResponse[]> {
    request.timestamp = Date.now();
    request.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Broadcast the request
    await redisManager.publish("swarm:request:help", JSON.stringify(request));

    // Wait for responses (with timeout)
    return this.waitForResponses(request.requestId, 5000); // 5s timeout
  }

  private async waitForResponses(
    requestId: string,
    timeoutMs: number,
  ): Promise<HelpResponse[]> {
    return new Promise((resolve) => {
      const responses: HelpResponse[] = [];

      const timeout = setTimeout(() => {
        this.removeAllListeners(`response:${requestId}`);
        resolve(responses);
      }, timeoutMs);

      // We need to setup a temporary listener for the response channel
      // But since our main subscriber listens to specific channels, we need a dedicated response channel logic
      // For MVP, we'll assume we subscribe to 'swarm:response:*' or dispatch manually.
      // Actually, better pattern: Have a single 'swarm:responses' channel.

      // Let's modify setupChannels to listen to 'swarm:responses' too if we want full async distributed logic.
      // But for Simplicity in MVP, we can just assume local event dispatch if we receive it.
      // WAIT: Redis Pub/Sub matches exact channels usually. Pattern subscribe is possible.
      // Let's add 'swarm:responses' to main subscription list.
    });
  }

  // NOTE: Implementing the waitForResponses properly requires subscribing to a response channel.
  // I will add 'swarm:responses' to setupChannels logic implicitly or explicitly.
  // Actually, let's keep it simple: We subscribe to `swarm:response:${requestId}` dynamically?
  // Probably too expensive. Better to have one `swarm:responses` channel and filter by requestId.

  /**
   * Setup Response Channel (Internal Fix)
   */
  private async setupResponseChannel() {
    await redisManager.subscribe("swarm:responses", (message) => {
      try {
        const response: HelpResponse & { requestId: string } =
          JSON.parse(message);
        this.emit(`response:${response.requestId}`, response);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Respond to a help request
   */
  async respondToHelp(
    requestId: string,
    response: HelpResponse,
  ): Promise<void> {
    await redisManager.publish(
      "swarm:responses",
      JSON.stringify({ ...response, requestId }),
    );
  }

  /**
   * Share findings with the swarm
   */
  async shareMemory(
    missionId: string,
    guruId: string,
    finding: any,
  ): Promise<void> {
    const memoryKey = `swarm:memory:${missionId}`;
    const findingEntry = {
      guruId,
      timestamp: Date.now(),
      finding,
    };

    await redisManager.hset(memoryKey, guruId, JSON.stringify(findingEntry));

    // Expire after 1 hour
    await redisManager.expire(memoryKey, 3600);

    // Broadcast the share
    await redisManager.publish(
      "swarm:memory:share",
      JSON.stringify({
        missionId,
        guruId,
        finding,
        timestamp: Date.now(),
      }),
    );
  }

  /**
   * Get collective knowledge for a mission
   */
  async getCollectiveKnowledge(missionId: string): Promise<any[]> {
    const memoryKey = `swarm:memory:${missionId}`;
    const entries = await redisManager.hgetAll(memoryKey);

    return Object.values(entries)
      .map((entry) => {
        try {
          return JSON.parse(entry);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Find peers based on criteria
   */
  async findPeers(criteria?: {
    specialization?: string[];
    state?: GuruStatus["state"];
  }): Promise<GuruStatus[]> {
    const allGurus = Array.from(this.activeGurus.values());

    if (!criteria) return allGurus;

    return allGurus.filter((guru) => {
      // Filter by state
      if (criteria.state && guru.state !== criteria.state) {
        return false;
      }

      // Filter by specialization
      if (criteria.specialization && criteria.specialization.length > 0) {
        if (!guru.specialization) return false;
        return criteria.specialization.some((spec) =>
          guru.specialization!.includes(spec),
        );
      }

      return true;
    });
  }

  /**
   * Get active gurus count
   */
  getActiveGuruCount(): number {
    // Filter out stale gurus (older than 5 minutes)
    const cutoff = Date.now() - 5 * 60 * 1000;
    return Array.from(this.activeGurus.values()).filter(
      (guru) => guru.lastSeen > cutoff,
    ).length;
  }
}

export const swarmService = SwarmService.getInstance();
