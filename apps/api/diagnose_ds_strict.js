const { createOpenAI } = require("@ai-sdk/openai");
const { generateText } = require("ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function diagnose() {
  const ds = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
    compatibility: "strict",
  });

  console.log("\n--- Testing DeepSeek (Strict + Root) ---");
  try {
    const res = await generateText({
      model: ds("deepseek-chat"),
      prompt: "hi",
    });
    console.log("Success:", res.text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

diagnose();
