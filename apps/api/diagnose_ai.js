const { createOpenAI } = require("@ai-sdk/openai");
const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { generateText } = require("ai");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Simplified fixToolSchemas for the diagnostic
function fixToolSchemas(tools) {
  if (!tools || tools.length === 0) return tools;
  return tools.map(tool => {
    if (tool.type === 'function' && tool.function) return tool;
    return {
      type: 'function',
      function: {
        name: tool.name || tool.function?.name,
        description: tool.description || tool.function?.description || '',
        parameters: tool.parameters || tool.function?.parameters || {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: false
        }
      }
    };
  });
}

async function deepseekFetch(url, options = {}) {
  let body;
  if (options.body && typeof options.body === 'string') {
    try { body = JSON.parse(options.body); } catch (e) {}
  }
  
  if (body?.tools) {
    body.tools = fixToolSchemas(body.tools);
  }

  if (body?.input && !body.messages) {
    console.log("[DeepSeek SDK] Mapping input to messages");
    body.messages = body.input;
    delete body.input;
  }
  
  if (body) console.log(`[DeepSeek SDK] Final Keys: ${Object.keys(body)}`);

  console.log(`[DeepSeek SDK] Raw URL: ${url}`);
  const finalUrl = (url.includes("/chat/completions") || url.includes("/responses")) 
    ? "https://api.deepseek.com/chat/completions" 
    : url;
  
  if (finalUrl !== url) console.log(`[DeepSeek SDK] Forcing URL: ${finalUrl}`);
  
  const fixedOptions = {
    ...options,
    body: body ? JSON.stringify(body) : options.body
  };
  return fetch(finalUrl, fixedOptions);
}

async function diagnose() {
  const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
    fetch: deepseekFetch
  });

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  console.log("\n--- Testing DeepSeek ---");
  try {
    const res = await generateText({
      model: deepseek("deepseek-chat"),
      prompt: "hi",
    });
    console.log("✅ DeepSeek Success: " + res.text.substring(0, 50) + "...");
  } catch (err) {
    console.error("❌ DeepSeek Error:", err.message);
  }

  console.log("\n--- Testing Google AI ---");
  try {
    const res = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: "hi",
    });
    console.log("✅ Google AI Success: " + res.text.substring(0, 50) + "...");
  } catch (err) {
    console.error("❌ Google AI Error:", err.message);
  }
}

diagnose();
