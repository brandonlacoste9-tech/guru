const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log("All Available Models:");
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("No models found:", data);
    }
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
