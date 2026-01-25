import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { redisManager } from "../lib/redis";

export class SocketService {
  private static io: SocketServer | null = null;

  static init(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log(`📡 WebSocket client connected: ${socket.id}`);

      socket.on("subscribe", (runId: string) => {
        socket.join(runId);
        console.log(`🔔 Socket ${socket.id} subscribed to run: ${runId}`);
      });

      socket.on("disconnect", () => {
        console.log(`📡 WebSocket client disconnected: ${socket.id}`);
      });

      socket.on("join_swarm", () => {
        socket.join("swarm_feed");
        console.log(`🐝 Socket ${socket.id} joined swarm feed`);
      });
    });

    // Subscribe to Swarm Redis Channels
    redisManager.subscriber.subscribe("swarm:broadcast:status", (err) => {
      if (err) console.error("Failed to subscribe to swarm status", err);
    });

    redisManager.subscriber.on("message", (channel, message) => {
      if (channel === "swarm:broadcast:status") {
        try {
          const status = JSON.parse(message);
          this.io?.to("swarm_feed").emit("swarm_update", {
            type: "status",
            data: status,
          });
        } catch (e) {
          console.error("Socket Swarm Forward Error", e);
        }
      }
    });

    console.log("📡 WebSocket Service initialized.");
  }

  static emitStatus(
    runId: string,
    status: string,
    message: string,
    data?: any,
  ) {
    if (this.io) {
      this.io.to(runId).emit("automation_status", {
        runId,
        status,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
      // Also emit to a global room for dashboard overviews
      this.io.to("global_monitoring").emit("automation_status", {
        runId,
        status,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
