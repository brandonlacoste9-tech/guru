const { createOpenAI } = require("@ai-sdk/openai");
const { generateText } = require("ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function diagnose() {
  const ds_v1 = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });

  const ds_root = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  console.log("\n--- Testing DeepSeek (/v1) ---");
  try {
    const res = await generateText({
      model: ds_v1("deepseek-chat"),
      prompt: "hi",
    });
    console.log("Success (/v1):", res.text);
  } catch (err) {
    console.error("Error (/v1):", err.message);
  }

  console.log("\n--- Testing DeepSeek (Root) ---");
  try {
    const res = await generateText({
      model: ds_root("deepseek-chat"),
      prompt: "hi",
    });
    console.log("Success (Root):", res.text);
  } catch (err) {
    console.error("Error (Root):", err.message);
  }
}

diagnose();
