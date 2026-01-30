import { sidecarClient } from "./sidecarClient";

/**
 * Manages browser sessions for persistent execution across multiple agent steps.
 * Sessions are keyed by guruId + runId to maintain isolation.
 */
export class SessionManager {
  private sessions: Map<string, string> = new Map(); // key: "guruId:runId", value: sessionId
  private sessionOptions: Map<string, { headless: boolean; llm_provider: string }> = new Map();

  /**
   * Get or create a session for a guru/run combination
   */
  async getOrCreateSession(
    guruId: string,
    runId: string,
    options: { headless?: boolean; llm_provider?: string } = {}
  ): Promise<string> {
    const key = `${guruId}:${runId}`;
    
    // Check if session already exists
    if (this.sessions.has(key)) {
      const sessionId = this.sessions.get(key)!;
      console.log(`📦 Reusing existing session ${sessionId} for ${key}`);
      return sessionId;
    }

    // Create new session
    console.log(`🆕 Creating new browser session for ${key}`);
    try {
      const session = await sidecarClient.createSession({
        headless: options.headless ?? true,
        llm_provider: options.llm_provider ?? "google",
      });

      this.sessions.set(key, session.session_id);
      this.sessionOptions.set(key, {
        headless: options.headless ?? true,
        llm_provider: options.llm_provider ?? "google",
      });

      console.log(`✅ Created session ${session.session_id} for ${key}`);
      return session.session_id;
    } catch (error: any) {
      console.error(`❌ Failed to create session for ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session ID for a guru/run combination (returns undefined if not exists)
   */
  getSession(guruId: string, runId: string): string | undefined {
    const key = `${guruId}:${runId}`;
    return this.sessions.get(key);
  }

  /**
   * Close a session for a guru/run combination
   */
  async closeSession(guruId: string, runId: string): Promise<void> {
    const key = `${guruId}:${runId}`;
    const sessionId = this.sessions.get(key);
    
    if (sessionId) {
      try {
        await sidecarClient.closeSession(sessionId);
        this.sessions.delete(key);
        this.sessionOptions.delete(key);
        console.log(`🔒 Closed session ${sessionId} for ${key}`);
      } catch (error: any) {
        console.error(`❌ Failed to close session ${sessionId}: ${error.message}`);
        // Still remove from map even if close failed
        this.sessions.delete(key);
        this.sessionOptions.delete(key);
      }
    }
  }

  /**
   * Close all sessions
   */
  async closeAllSessions(): Promise<void> {
    console.log(`🔒 Closing all ${this.sessions.size} sessions...`);
    try {
      await sidecarClient.closeAllSessions();
      this.sessions.clear();
      this.sessionOptions.clear();
      console.log(`✅ All sessions closed`);
    } catch (error: any) {
      console.error(`❌ Failed to close all sessions: ${error.message}`);
      // Clear maps anyway
      this.sessions.clear();
      this.sessionOptions.clear();
    }
  }

  /**
   * List all active sessions
   */
  listSessions(): Array<{ key: string; sessionId: string }> {
    return Array.from(this.sessions.entries()).map(([key, sessionId]) => ({
      key,
      sessionId,
    }));
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
