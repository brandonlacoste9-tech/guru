import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

// Ensure environment variables are loaded if this file is imported directly
// This attempts to find the .env file if process.env.REDIS_URL is not set
if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
  const isDist = __dirname.includes("dist");
  const envPath = isDist
    ? path.join(__dirname, "../../../.env")
    : path.join(__dirname, "../../../../.env");
  dotenv.config({ path: envPath });
}

class RedisManager {
  public publisher: Redis;
  public subscriber: Redis;
  public queueClient: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    let redisOptions: any = {};

    if (redisUrl && !redisUrl.includes("your-redis")) {
      // Use URL if available
      redisOptions = redisUrl;
    } else {
      // Fallback to host/port
      redisOptions = {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
      };
    }

    // Clean up undefined/empty password
    if (typeof redisOptions === "object" && !redisOptions.password) {
      delete redisOptions.password;
    }

    // We need separate connections for Pub, Sub, and generic commands (Queue/KV)
    // If passed a URL string, ioredis creates new connections automatically
    if (typeof redisOptions === "string") {
      this.publisher = new Redis(redisOptions);
      this.subscriber = new Redis(redisOptions);
      this.queueClient = new Redis(redisOptions, {
        maxRetriesPerRequest: null,
      });
    } else {
      this.publisher = new Redis(redisOptions);
      this.subscriber = new Redis(redisOptions);
      this.queueClient = new Redis(redisOptions);
    }

    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    const clients = [
      { client: this.publisher, name: "Publisher" },
      { client: this.subscriber, name: "Subscriber" },
      { client: this.queueClient, name: "QueueClient" },
    ];

    clients.forEach(({ client, name }) => {
      client.on("error", (err) => {
        // Suppress connection refused logs in dev if redis isn't running
        if ((err as any).code === "ECONNREFUSED") return;
        console.error(`Redis ${name} error:`, err.message);
      });
      client.on("connect", () => {
        console.log(`Redis ${name} connected`);
      });
    });
  }

  // Publisher methods
  async publish(channel: string, message: string): Promise<number> {
    return this.publisher.publish(channel, message);
  }

  // Subscriber methods
  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on("message", (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // Generic KV methods (using queueClient/generic connection)
  async set(key: string, value: string, expirySeconds?: number): Promise<"OK"> {
    if (expirySeconds) {
      return this.queueClient.setex(key, expirySeconds, value);
    }
    return this.queueClient.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.queueClient.get(key);
  }

  async hset(hash: string, field: string, value: string): Promise<number> {
    return this.queueClient.hset(hash, field, value);
  }

  async hget(hash: string, field: string): Promise<string | null> {
    return this.queueClient.hget(hash, field);
  }

  async hgetAll(hash: string): Promise<Record<string, string>> {
    return this.queueClient.hgetall(hash);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.queueClient.expire(key, seconds);
  }

  // Graceful shutdown
  async quit(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
      this.queueClient.quit(),
    ]);
  }
}

// Singleton instance
export const redisManager = new RedisManager();
