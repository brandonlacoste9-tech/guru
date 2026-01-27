import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../../../.env"), override: true });

import { initTracing } from "./lib/tracing";
initTracing();

import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import automationRoutes from "./routes/automationRoutes";
import chaosRoutes from "./routes/chaosRoutes";
import guruRoutes from "./routes/guruRoutes";
import marketplaceRoutes from "./routes/marketplaceRoutes";
import schedulerRoutes from "./routes/schedulerRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import copilotRoutes from "./routes/copilotRoutes";
import { metaLearningService } from "./services/metaLearningService";

import { schedulerService } from "./services/scheduler.service";
import { SocketService } from "./services/socketService";
import { useSecurityHeaders } from "./middleware/securityHeaders";
// Initialize scheduler (runs on app start)
// Initialize services
schedulerService;
metaLearningService.init();

const app = express();
const port = Number(process.env.PORT) || 4000;
const httpServer = createServer(app);

// Initialize WebSockets
SocketService.init(httpServer);

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

app.use(useSecurityHeaders); // Use our custom security configuration
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/", apiLimiter); // Apply rate limiting to all API routes
app.use("/temp", express.static(path.join(__dirname, "../temp")));

// Routes
app.use("/api/automation", automationRoutes);
app.use("/api/test", chaosRoutes);
app.use("/api/gurus", guruRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/scheduler", schedulerRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/copilot", copilotRoutes);
import guruAutomationRoutes from "./routes/guruAutomationRoutes";
app.use("/api/guru-automations", guruAutomationRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "floguru-api",
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`🚀 FloGuru API running on http://0.0.0.0:${port}`);
});
