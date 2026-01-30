import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";

export interface SidecarExecuteRequest {
  task_description: string;
  session_id?: string;
  headless?: boolean;
  llm_provider?: string;
  llm_model?: string;
  run_id?: string;
}

export interface SidecarExecuteResponse {
  success: boolean;
  run_id: string;
  history: Array<{
    step: number;
    action: string;
    result: string;
    timestamp: string;
  }>;
  duration_ms: number;
  started_at: string;
  completed_at: string;
  error?: string;
}

export interface SessionInfo {
  session_id: string;
  headless: boolean;
  created_at: string;
  last_activity: string;
  task_count: number;
}

/**
 * Client for communicating with the Python sidecar with:
 * - Retry logic with exponential backoff
 * - Connection pooling
 * - Health checks
 * - Session management
 */
export class SidecarClient {
  private client: AxiosInstance;
  private baseURL: string;
  private healthCheckInterval?: NodeJS.Timeout;
  private isHealthy: boolean = true;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.PYTHON_SIDECAR_URL || "http://localhost:8001";
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 120000, // 2 minutes default timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Configure retry logic with exponential backoff
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx server errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status !== undefined && error.response.status >= 500)
        );
      },
      onRetry: (retryCount, error) => {
        console.warn(
          `🔄 Sidecar retry ${retryCount}/3 for ${error.config?.url}: ${error.message}`
        );
      },
    });

    // Start health check
    this.startHealthCheck();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      this.isHealthy = response.status === 200;
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      console.warn(`⚠️ Sidecar health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Start periodic health checks (every 30 seconds)
   */
  private startHealthCheck() {
    // Initial health check
    this.healthCheck();

    // Periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 30000);
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Create a new browser session
   */
  async createSession(
    options: {
      headless?: boolean;
      llm_provider?: string;
      llm_model?: string;
    } = {}
  ): Promise<{ session_id: string; created_at: string }> {
    try {
      const response = await this.client.post("/sessions/create", null, {
        params: {
          headless: options.headless ?? true,
          llm_provider: options.llm_provider ?? "google",
          llm_model: options.llm_model,
        },
      });

      if (response.data.success) {
        return {
          session_id: response.data.session_id,
          created_at: response.data.created_at,
        };
      }

      throw new Error("Failed to create session");
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Sidecar session creation failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Execute a task using a session (persistent browser)
   */
  async executeWithSession(
    request: SidecarExecuteRequest
  ): Promise<SidecarExecuteResponse> {
    const sessionId = request.session_id;
    
    if (!sessionId) {
      throw new Error("session_id is required for session-based execution");
    }

    try {
      const response = await this.client.post<SidecarExecuteResponse>(
        `/sessions/${sessionId}/execute`,
        request
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // If session not found, try to create it
        if (error.response?.status === 404 && sessionId) {
          console.log(`📦 Session ${sessionId} not found, creating new session...`);
          await this.createSession({
            headless: request.headless,
            llm_provider: request.llm_provider,
            llm_model: request.llm_model,
          });
          
          // Retry once after creating session
          const retryResponse = await this.client.post<SidecarExecuteResponse>(
            `/sessions/${sessionId}/execute`,
            request
          );
          return retryResponse.data;
        }

        throw new Error(
          `Sidecar execution failed: ${error.message} - ${error.response?.data?.detail || ""}`
        );
      }
      throw error;
    }
  }

  /**
   * Execute a task (legacy endpoint - creates new browser)
   */
  async execute(
    request: {
      task_description: string;
      user_id: string;
      automation_id: string;
      run_id: string;
      config?: Record<string, any>;
      headless?: boolean;
      llm_provider?: string;
      llm_model?: string;
    }
  ): Promise<SidecarExecuteResponse> {
    try {
      const response = await this.client.post<SidecarExecuteResponse>(
        "/execute",
        {
          task_description: request.task_description,
          user_id: request.user_id,
          automation_id: request.automation_id,
          run_id: request.run_id,
          config: request.config || {},
          headless: request.headless ?? true,
          llm_provider: request.llm_provider || "google",
          llm_model: request.llm_model,
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Sidecar execution failed: ${error.message} - ${error.response?.data?.detail || ""}`
        );
      }
      throw error;
    }
  }

  /**
   * List all active sessions
   */
  async listSessions(): Promise<{ sessions: SessionInfo[]; count: number }> {
    try {
      const response = await this.client.get<{
        success: boolean;
        sessions: SessionInfo[];
        count: number;
      }>("/sessions");

      return {
        sessions: response.data.sessions,
        count: response.data.count,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to list sessions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Close a specific session
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      await this.client.delete(`/sessions/${sessionId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to close session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Close all sessions
   */
  async closeAllSessions(): Promise<void> {
    try {
      await this.client.delete("/sessions");
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to close all sessions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): boolean {
    return this.isHealthy;
  }
}

// Singleton instance
export const sidecarClient = new SidecarClient();
