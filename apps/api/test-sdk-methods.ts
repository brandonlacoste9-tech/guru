import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testChatMethod() {
  const openai = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });

  console.log("Checking if .chat exists...");
  console.log("openai.chat:", typeof (openai as any).chat);
  console.log("openai.completion:", typeof (openai as any).completion);

  try {
    const res = await generateText({
      model: (openai as any).chat("deepseek-chat"),
      prompt: "hi",
    });
    console.log("Success with .chat()");
  } catch (err: any) {
    console.log("Failed with .chat():", err.message);
  }
}

testChatMethod();
