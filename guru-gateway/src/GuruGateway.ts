import { makeWASocket } from "@whiskeysockets/baileys";
import { Bot as TelegramBot } from "grammy";
import { Client as DiscordClient, IntentsBitField } from "discord.js";
import { WebSocketServer } from "ws";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { EventEmitter } from "events";

// ------------------------------------------------------------
// 1️⃣  Python bridge (Browser‑Use)
// ------------------------------------------------------------
class BrowserUseBridge extends EventEmitter {
  private proc: ChildProcessWithoutNullStreams;

  constructor() {
    super();
    const pyPath = path.resolve(
      __dirname,
      "../../browser-use/python_bridge/browser_use_agent.py",
    );
    // In Docker, the path is relative to WORKDIR /app/guru-gateway
    // So ../../browser-use resolves to /app/browser-use
    this.proc = spawn("python3", [pyPath]);

    this.proc.stdout.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      for (const line of lines) {
        try {
          this.emit("result", JSON.parse(line));
        } catch (_) {}
      }
    });

    this.proc.stderr.on("data", (d) => console.error("[PY]", d.toString()));
    this.proc.on("exit", (c) => console.log("[PY] exited", c));
  }

  async exec(payload: object): Promise<any> {
    return new Promise((resolve) => {
      const once = (msg: any) => {
        this.removeListener("result", once);
        resolve(msg);
      };
      this.on("result", once);
      this.proc.stdin.write(JSON.stringify(payload) + "\n");
    });
  }
}

// ------------------------------------------------------------
// 2️⃣  Channel adapters (Telegram / WhatsApp / Discord)
// ------------------------------------------------------------
type Channel = "telegram" | "whatsapp" | "discord";

class ChannelAdapter {
  // Telegram
  telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!);
  // Discord
  discord = new DiscordClient({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
    ],
  });

  constructor() {
    this.telegram.start(); // listens instantly
    this.discord.login(process.env.DISCORD_BOT_TOKEN);
  }

  async send(channel: Channel, to: string, text: string) {
    if (channel === "telegram")
      await this.telegram.api.sendMessage(to, { text });
    else if (channel === "discord") {
      const c = await this.discord.channels.fetch(to);
      if (c?.isTextBased()) await c.send(text);
    }
    // WhatsApp is already handled by the original Clawdbot CLI
  }
}

// ------------------------------------------------------------
// 3️⃣  Guru router – maps a plain text request to a Guru ID
// ------------------------------------------------------------
type GuruId = "FITNESS" | "STUDY" | "ORGANIZE" | "STRESS" | "ARCHITECT";

interface Guru {
  id: GuruId;
  emoji: string;
  triggers: string[];
}
const GURUS: Guru[] = [
  {
    id: "FITNESS",
    emoji: "💪",
    triggers: ["workout", "run", "gym", "whoop", "fitness"],
  },
  {
    id: "STUDY",
    emoji: "📚",
    triggers: ["study", "read", "paper", "research", "notes"],
  },
  {
    id: "ORGANIZE",
    emoji: "🗂️",
    triggers: ["todo", "organize", "calendar", "remind", "task"],
  },
  {
    id: "STRESS",
    emoji: "🧘",
    triggers: ["meditate", "stress", "anxiety", "sleep", "relax"],
  },
  {
    id: "ARCHITECT",
    emoji: "🛠️",
    triggers: [
      "update api",
      "deploy",
      "fix redis",
      "monitor",
      "run tests",
      "sync db",
      "architect",
    ],
  },
];
function pickGuru(msg: string): Guru {
  const lower = msg.toLowerCase();
  for (const g of GURUS) {
    if (g.triggers.some((t) => lower.includes(t))) return g;
  }
  // fallback – treat as ORGANIZE
  return GURUS.find((g) => g.id === "ORGANIZE")!;
}

// ------------------------------------------------------------
// 4️⃣  Main WebSocket server (listen for FloGuru)
// ------------------------------------------------------------
async function main() {
  const bridge = new BrowserUseBridge();
  const channels = new ChannelAdapter();

  // ---- WebSocket server (port 19789) ----
  const wss = new WebSocketServer({ port: 19789 });
  console.log("🚀 GURU gateway listening on ws://localhost:19789");

  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      const { channel, from, text } = JSON.parse(msg.toString());

      // 1️⃣ Route → Guru
      const guru = pickGuru(text);
      const payload = {
        guru: guru.id,
        task: text,
        llm: "deepseek-v3",
        use_cloud: false, // set true if you want Browser‑Use Cloud
      };

      // 2️⃣ Run the Python Bridge (Playwright + LLM)
      const result = await bridge.exec(payload);

      // 3️⃣ Build a friendly reply
      const reply = `${guru.emoji} *${guru.id}* – ${result.history
        .slice(-1)[0]
        .content.trim()}`;

      // 4️⃣ Send reply via the proper chat channel
      await channels.send(channel as Channel, from, reply);
    });
  });
}
main().catch((e) => console.error("❌ GURU gateway error", e));
